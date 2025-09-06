from fastapi import APIRouter, Depends, Query, HTTPException, Path
from typing import Dict, Any, Optional
from datetime import datetime
import asyncpg
from uuid import UUID

from core.deps import get_current_user, require_admin
from db.pool import get_pool
from utils.pagination import parse_pagination_params
from models.schemas import InstructorsList, InstructorRow, AssignmentBody, InstructorApproval

router = APIRouter()


@router.get("", response_model=InstructorsList)
async def get_instructors(
    status: Optional[str] = Query(None, description="Filter by status: pending, approved, denied"),
    page: Optional[int] = Query(1, ge=1),
    page_size: Optional[int] = Query(20, ge=1, le=100),
    user: Dict[str, Any] = Depends(require_admin)
):
    """
    Get paginated list of instructors (admin only).
    
    Filters:
    - status: pending, approved, denied
    """
    pool = get_pool()
    
    # Parse pagination
    pagination = parse_pagination_params(page, page_size)
    
    # Build query conditions
    conditions = ["u.role = 'instructor'"]  # Only instructor users
    params = []
    
    if status:
        conditions.append(f"u.status = ${len(params) + 1}")
        params.append(status)
    
    where_clause = "WHERE " + " AND ".join(conditions)
    
    try:
        # Get total count
        count_query = f"""
            SELECT COUNT(*) as total
            FROM users_app u
            {where_clause}
        """
        
        total_result = await pool.fetchrow(count_query, *params)
        total = total_result['total'] if total_result else 0
        
        # Get paginated results with bootcamp count
        query = f"""
            SELECT 
                u.id as user_id,
                u.email,
                u.full_name,
                u.status,
                u.approved_at,
                u.approved_by,
                u.created_at,
                COALESCE(bootcamp_counts.bootcamp_count, 0) as bootcamp_count
            FROM users_app u
            LEFT JOIN (
                SELECT 
                    instructor_id,
                    COUNT(*) as bootcamp_count
                FROM instructor_bootcamps
                GROUP BY instructor_id
            ) bootcamp_counts ON u.id = bootcamp_counts.instructor_id
            {where_clause}
            ORDER BY 
                CASE u.status 
                    WHEN 'pending' THEN 1
                    WHEN 'approved' THEN 2
                    WHEN 'denied' THEN 3
                    ELSE 4
                END,
                u.created_at DESC
            LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
        """
        
        params.extend([pagination['limit'], pagination['offset']])
        rows = await pool.fetch(query, *params)
        
        items = [
            InstructorRow(
                user_id=row['user_id'],
                email=row['email'],
                full_name=row['full_name'],
                status=row['status'],
                approved_at=row['approved_at'],
                approved_by=row['approved_by'],
                created_at=row['created_at'],
                bootcamp_count=row['bootcamp_count']
            )
            for row in rows
        ]
        
        return InstructorsList(
            items=items,
            page=pagination['page'],
            page_size=pagination['page_size'],
            total=total
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch instructors: {str(e)}"
        )


@router.post("/{user_id}/approve")
async def approve_instructor(
    user_id: UUID = Path(..., description="User ID to approve"),
    user: Dict[str, Any] = Depends(require_admin)
):
    """Approve an instructor (admin only)."""
    pool = get_pool()
    
    try:
        # Check if user exists and is pending
        check_query = """
            SELECT id, status, role FROM users_app 
            WHERE id = $1 AND role = 'instructor'
        """
        
        instructor = await pool.fetchrow(check_query, user_id)
        
        if not instructor:
            raise HTTPException(
                status_code=404,
                detail="Instructor not found"
            )
        
        if instructor['status'] == 'approved':
            raise HTTPException(
                status_code=400,
                detail="Instructor is already approved"
            )
        
        # Update status
        update_query = """
            UPDATE users_app 
            SET status = 'approved', 
                approved_at = NOW(), 
                approved_by = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING approved_at
        """
        
        result = await pool.fetchrow(update_query, user["user_id"], user_id)
        
        return {
            "user_id": user_id,
            "status": "approved",
            "approved_at": result['approved_at'],
            "approved_by": user["user_id"],
            "message": "Instructor approved successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to approve instructor: {str(e)}"
        )


@router.post("/{user_id}/reject")
async def reject_instructor(
    user_id: UUID = Path(..., description="User ID to reject"),
    approval_data: InstructorApproval = ...,
    user: Dict[str, Any] = Depends(require_admin)
):
    """Reject an instructor (admin only)."""
    pool = get_pool()
    
    try:
        # Check if user exists
        check_query = """
            SELECT id, status, role FROM users_app 
            WHERE id = $1 AND role = 'instructor'
        """
        
        instructor = await pool.fetchrow(check_query, user_id)
        
        if not instructor:
            raise HTTPException(
                status_code=404,
                detail="Instructor not found"
            )
        
        if instructor['status'] == 'denied':
            raise HTTPException(
                status_code=400,
                detail="Instructor is already denied"
            )
        
        # Update status
        update_query = """
            UPDATE users_app 
            SET status = 'denied',
                approved_by = $1,
                updated_at = NOW()
            WHERE id = $2
        """
        
        await pool.execute(update_query, user["user_id"], user_id)
        
        return {
            "user_id": user_id,
            "status": "denied",
            "denied_by": user["user_id"],
            "reason": approval_data.reason,
            "message": "Instructor denied successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reject instructor: {str(e)}"
        )


@router.post("/{user_id}/assign")
async def assign_instructor_to_bootcamp(
    user_id: UUID = Path(..., description="Instructor user ID"),
    assignment_data: AssignmentBody = ...,
    user: Dict[str, Any] = Depends(require_admin)
):
    """Assign an approved instructor to a bootcamp (admin only)."""
    pool = get_pool()
    
    try:
        # Verify instructor is approved
        instructor_query = """
            SELECT id, status FROM users_app 
            WHERE id = $1 AND role = 'instructor' AND status = 'approved'
        """
        
        instructor = await pool.fetchrow(instructor_query, user_id)
        
        if not instructor:
            raise HTTPException(
                status_code=404,
                detail="Approved instructor not found"
            )
        
        # Check bootcamp exists and constraints
        bootcamp_query = """
            SELECT 
                bootcamp_id,
                bootcamp_name,
                allow_multiple_instructors,
                max_instructors,
                COALESCE(current_instructors.count, 0) as current_instructor_count
            FROM bootcamps b
            LEFT JOIN (
                SELECT bootcamp_id, COUNT(*) as count
                FROM instructor_bootcamps
                GROUP BY bootcamp_id
            ) current_instructors ON b.bootcamp_id = current_instructors.bootcamp_id
            WHERE b.bootcamp_id = $1
        """
        
        bootcamp = await pool.fetchrow(bootcamp_query, assignment_data.bootcamp_id)
        
        if not bootcamp:
            raise HTTPException(
                status_code=404,
                detail="Bootcamp not found"
            )
        
        # Check if instructor is already assigned
        existing_query = """
            SELECT 1 FROM instructor_bootcamps 
            WHERE instructor_id = $1 AND bootcamp_id = $2
        """
        
        existing = await pool.fetchrow(existing_query, user_id, assignment_data.bootcamp_id)
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Instructor is already assigned to this bootcamp"
            )
        
        # Check instructor limits
        if not bootcamp['allow_multiple_instructors'] and bootcamp['current_instructor_count'] > 0:
            raise HTTPException(
                status_code=400,
                detail="This bootcamp does not allow multiple instructors"
            )
        
        if bootcamp['current_instructor_count'] >= bootcamp['max_instructors']:
            raise HTTPException(
                status_code=400,
                detail=f"Bootcamp has reached maximum instructor limit ({bootcamp['max_instructors']})"
            )
        
        # If setting as primary, unset any existing primary
        if assignment_data.is_primary:
            await pool.execute(
                "UPDATE instructor_bootcamps SET is_primary = FALSE WHERE bootcamp_id = $1",
                assignment_data.bootcamp_id
            )
        
        # Create assignment (using assigned_at instead of created_at)
        insert_query = """
            INSERT INTO instructor_bootcamps (instructor_id, bootcamp_id, is_primary, assigned_at, assigned_by)
            VALUES ($1, $2, $3, NOW(), $4)
            RETURNING assigned_at
        """
        
        result = await pool.fetchrow(
            insert_query,
            user_id,
            assignment_data.bootcamp_id,
            assignment_data.is_primary or False,
            user["user_id"]
        )
        
        return {
            "instructor_id": user_id,
            "bootcamp_id": assignment_data.bootcamp_id,
            "bootcamp_name": bootcamp['bootcamp_name'],
            "is_primary": assignment_data.is_primary or False,
            "assigned_at": result['assigned_at'],
            "message": "Instructor assigned successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to assign instructor: {str(e)}"
        )


@router.delete("/{user_id}/assignments/{bootcamp_id}")
async def remove_instructor_assignment(
    user_id: UUID = Path(..., description="Instructor user ID"),
    bootcamp_id: int = Path(..., description="Bootcamp ID"),
    user: Dict[str, Any] = Depends(require_admin)
):
    """Remove instructor assignment from bootcamp (admin only)."""
    pool = get_pool()
    
    try:
        # Check if assignment exists
        check_query = """
            SELECT 1 FROM instructor_bootcamps 
            WHERE instructor_id = $1 AND bootcamp_id = $2
        """
        
        assignment = await pool.fetchrow(check_query, user_id, bootcamp_id)
        
        if not assignment:
            raise HTTPException(
                status_code=404,
                detail="Assignment not found"
            )
        
        # Remove assignment
        delete_query = """
            DELETE FROM instructor_bootcamps 
            WHERE instructor_id = $1 AND bootcamp_id = $2
        """
        
        await pool.execute(delete_query, user_id, bootcamp_id)
        
        return {
            "instructor_id": user_id,
            "bootcamp_id": bootcamp_id,
            "message": "Assignment removed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to remove assignment: {str(e)}"
        )