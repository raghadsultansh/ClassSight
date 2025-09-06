from fastapi import APIRouter, Depends, Query, HTTPException, Path
from typing import Dict, Any, Optional
from datetime import date
import asyncpg

from core.deps import get_current_user, require_admin, assert_bootcamp_scope, get_instructor_bootcamp_ids
from core.rbac import is_admin, is_instructor  
from db.pool import get_pool
from utils.pagination import parse_pagination_params
from models.schemas import BootcampsList, BootcampRow, BootcampCreate, BootcampUpdate

router = APIRouter()


@router.get("", response_model=BootcampsList)
async def get_bootcamps(
    status: Optional[str] = Query(None, description="Filter by status: upcoming, active, completed"),
    page: Optional[int] = Query(1, ge=1),
    page_size: Optional[int] = Query(20, ge=1, le=100),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get paginated list of bootcamps.
    
    - Admin: can view all bootcamps
    - Instructor: can view all bootcamps (but can only manage assigned ones)
    """
    pool = get_pool()
    
    # Parse pagination
    pagination = parse_pagination_params(page, page_size)
    
    # Build query conditions
    conditions = []
    params = []
    
    # Status filter (derived from dates)
    if status:
        if status == 'upcoming':
            conditions.append("CURRENT_DATE < b.start_date")
        elif status == 'active':
            conditions.append("CURRENT_DATE BETWEEN b.start_date AND b.end_date")
        elif status == 'completed':
            conditions.append("CURRENT_DATE > b.end_date")
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    try:
        # Get total count
        count_query = f"""
            SELECT COUNT(*) as total
            FROM bootcamps b
            {where_clause}
        """
        
        total_result = await pool.fetchrow(count_query, *params)
        total = total_result['total'] if total_result else 0
        
        # Get paginated results with aggregated counts
        query = f"""
            SELECT 
                b.bootcamp_id,
                b.bootcamp_name,
                b.start_date,
                b.end_date,
                b.allow_multiple_instructors,
                b.max_instructors,
                b.description,
                -- Determine status
                CASE 
                    WHEN CURRENT_DATE < b.start_date THEN 'upcoming'
                    WHEN CURRENT_DATE > b.end_date THEN 'completed'
                    ELSE 'active'
                END as status,
                -- Count students
                COALESCE(student_counts.count, 0) as student_count,
                -- Count instructors
                COALESCE(instructor_counts.count, 0) as instructor_count,
                -- Count units
                COALESCE(unit_counts.count, 0) as unit_count
            FROM bootcamps b
            -- Student counts
            LEFT JOIN (
                SELECT bootcamp_id, COUNT(*) as count
                FROM students
                GROUP BY bootcamp_id
            ) student_counts ON b.bootcamp_id = student_counts.bootcamp_id
            -- Instructor counts  
            LEFT JOIN (
                SELECT bootcamp_id, COUNT(*) as count
                FROM instructor_bootcamps
                GROUP BY bootcamp_id
            ) instructor_counts ON b.bootcamp_id = instructor_counts.bootcamp_id
            -- Unit counts
            LEFT JOIN (
                SELECT bootcamp_id, COUNT(*) as count
                FROM units
                GROUP BY bootcamp_id
            ) unit_counts ON b.bootcamp_id = unit_counts.bootcamp_id
            {where_clause}
            ORDER BY b.start_date DESC, b.bootcamp_name
            LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
        """
        
        params.extend([pagination['limit'], pagination['offset']])
        rows = await pool.fetch(query, *params)
        
        items = [
            BootcampRow(
                bootcamp_id=row['bootcamp_id'],
                bootcamp_name=row['bootcamp_name'],
                start_date=row['start_date'],
                end_date=row['end_date'],
                allow_multiple_instructors=row['allow_multiple_instructors'],
                max_instructors=row['max_instructors'],
                description=row['description'],
                status=row['status'],
                student_count=row['student_count'],
                instructor_count=row['instructor_count'],
                unit_count=row['unit_count']
            )
            for row in rows
        ]
        
        return BootcampsList(
            items=items,
            page=pagination['page'],
            page_size=pagination['page_size'],
            total=total
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch bootcamps: {str(e)}"
        )


@router.post("", response_model=BootcampRow)
async def create_bootcamp(
    bootcamp_data: BootcampCreate,
    user: Dict[str, Any] = Depends(require_admin)
):
    """Create a new bootcamp (admin only)."""
    pool = get_pool()
    
    # Validate dates
    if bootcamp_data.start_date >= bootcamp_data.end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date must be before end date"
        )
    
    try:
        # Check for name conflicts
        name_check = await pool.fetchrow(
            "SELECT 1 FROM bootcamps WHERE bootcamp_name = $1",
            bootcamp_data.bootcamp_name
        )
        
        if name_check:
            raise HTTPException(
                status_code=400,
                detail="A bootcamp with this name already exists"
            )
        
        # Create bootcamp (schema has created_by field)
        insert_query = """
            INSERT INTO bootcamps (
                bootcamp_name, start_date, end_date, allow_multiple_instructors,
                max_instructors, description, created_by, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING bootcamp_id, created_at
        """
        
        result = await pool.fetchrow(
            insert_query,
            bootcamp_data.bootcamp_name,
            bootcamp_data.start_date,
            bootcamp_data.end_date,
            bootcamp_data.allow_multiple_instructors,
            bootcamp_data.max_instructors,
            bootcamp_data.description,
            user["user_id"]
        )
        
        # Determine status
        today = date.today()
        if today < bootcamp_data.start_date:
            status = 'upcoming'
        elif today > bootcamp_data.end_date:
            status = 'completed'
        else:
            status = 'active'
        
        return BootcampRow(
            bootcamp_id=result['bootcamp_id'],
            bootcamp_name=bootcamp_data.bootcamp_name,
            start_date=bootcamp_data.start_date,
            end_date=bootcamp_data.end_date,
            allow_multiple_instructors=bootcamp_data.allow_multiple_instructors,
            max_instructors=bootcamp_data.max_instructors,
            description=bootcamp_data.description,
            status=status,
            student_count=0,
            instructor_count=0,
            unit_count=0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create bootcamp: {str(e)}"
        )


@router.get("/{bootcamp_id}", response_model=BootcampRow)
async def get_bootcamp(
    bootcamp_id: int = Path(..., description="Bootcamp ID"),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get a specific bootcamp by ID."""
    pool = get_pool()
    
    # Check access permissions
    await assert_bootcamp_scope(user, bootcamp_id, pool)
    
    try:
        query = """
            SELECT 
                b.bootcamp_id,
                b.bootcamp_name,
                b.start_date,
                b.end_date,
                b.allow_multiple_instructors,
                b.max_instructors,
                b.description,
                -- Determine status
                CASE 
                    WHEN CURRENT_DATE < b.start_date THEN 'upcoming'
                    WHEN CURRENT_DATE > b.end_date THEN 'completed'
                    ELSE 'active'
                END as status,
                -- Count students
                COALESCE(student_counts.count, 0) as student_count,
                -- Count instructors
                COALESCE(instructor_counts.count, 0) as instructor_count,
                -- Count units
                COALESCE(unit_counts.count, 0) as unit_count
            FROM bootcamps b
            -- Student counts
            LEFT JOIN (
                SELECT bootcamp_id, COUNT(*) as count
                FROM students
                WHERE bootcamp_id = $1
                GROUP BY bootcamp_id
            ) student_counts ON b.bootcamp_id = student_counts.bootcamp_id
            -- Instructor counts  
            LEFT JOIN (
                SELECT bootcamp_id, COUNT(*) as count
                FROM instructor_bootcamps
                WHERE bootcamp_id = $1
                GROUP BY bootcamp_id
            ) instructor_counts ON b.bootcamp_id = instructor_counts.bootcamp_id
            -- Unit counts
            LEFT JOIN (
                SELECT bootcamp_id, COUNT(*) as count
                FROM units
                WHERE bootcamp_id = $1
                GROUP BY bootcamp_id
            ) unit_counts ON b.bootcamp_id = unit_counts.bootcamp_id
            WHERE b.bootcamp_id = $1
        """
        
        row = await pool.fetchrow(query, bootcamp_id)
        
        if not row:
            raise HTTPException(status_code=404, detail="Bootcamp not found")
        
        return BootcampRow(
            bootcamp_id=row['bootcamp_id'],
            bootcamp_name=row['bootcamp_name'],
            start_date=row['start_date'],
            end_date=row['end_date'],
            allow_multiple_instructors=row['allow_multiple_instructors'],
            max_instructors=row['max_instructors'],
            description=row['description'],
            status=row['status'],
            student_count=row['student_count'],
            instructor_count=row['instructor_count'],
            unit_count=row['unit_count']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch bootcamp: {str(e)}"
        )


@router.patch("/{bootcamp_id}", response_model=BootcampRow)
async def update_bootcamp(
    bootcamp_id: int = Path(..., description="Bootcamp ID"),
    bootcamp_data: BootcampUpdate = ...,
    user: Dict[str, Any] = Depends(require_admin)
):
    """Update a bootcamp (admin only)."""
    pool = get_pool()
    
    try:
        # Check if bootcamp exists
        existing = await pool.fetchrow(
            "SELECT * FROM bootcamps WHERE bootcamp_id = $1",
            bootcamp_id
        )
        
        if not existing:
            raise HTTPException(status_code=404, detail="Bootcamp not found")
        
        # Validate date logic if both dates are being updated
        start_date = bootcamp_data.start_date or existing['start_date']
        end_date = bootcamp_data.end_date or existing['end_date']
        
        if start_date >= end_date:
            raise HTTPException(
                status_code=400,
                detail="Start date must be before end date"
            )
        
        # Build update query dynamically
        updates = []
        params = []
        param_idx = 1
        
        if bootcamp_data.bootcamp_name is not None:
            # Check for name conflicts (excluding current bootcamp)
            name_check = await pool.fetchrow(
                "SELECT 1 FROM bootcamps WHERE bootcamp_name = $1 AND bootcamp_id != $2",
                bootcamp_data.bootcamp_name, bootcamp_id
            )
            if name_check:
                raise HTTPException(
                    status_code=400,
                    detail="A bootcamp with this name already exists"
                )
            
            updates.append(f"bootcamp_name = ${param_idx}")
            params.append(bootcamp_data.bootcamp_name)
            param_idx += 1
        
        if bootcamp_data.start_date is not None:
            updates.append(f"start_date = ${param_idx}")
            params.append(bootcamp_data.start_date)
            param_idx += 1
        
        if bootcamp_data.end_date is not None:
            updates.append(f"end_date = ${param_idx}")
            params.append(bootcamp_data.end_date)
            param_idx += 1
        
        if bootcamp_data.allow_multiple_instructors is not None:
            updates.append(f"allow_multiple_instructors = ${param_idx}")
            params.append(bootcamp_data.allow_multiple_instructors)
            param_idx += 1
        
        if bootcamp_data.max_instructors is not None:
            updates.append(f"max_instructors = ${param_idx}")
            params.append(bootcamp_data.max_instructors)
            param_idx += 1
        
        if bootcamp_data.description is not None:
            updates.append(f"description = ${param_idx}")
            params.append(bootcamp_data.description)
            param_idx += 1
        
        if not updates:
            raise HTTPException(
                status_code=400,
                detail="No fields to update"
            )
        
        # Schema doesn't have updated_at field
        params.append(bootcamp_id)
        
        # Execute update
        update_query = f"""
            UPDATE bootcamps 
            SET {', '.join(updates)}
            WHERE bootcamp_id = ${param_idx}
            RETURNING *
        """
        
        updated = await pool.fetchrow(update_query, *params)
        
        # Get counts for response
        counts_query = """
            SELECT 
                COALESCE(s.count, 0) as student_count,
                COALESCE(i.count, 0) as instructor_count,
                COALESCE(u.count, 0) as unit_count
            FROM (SELECT 1) dummy
            LEFT JOIN (SELECT COUNT(*) as count FROM students WHERE bootcamp_id = $1) s ON true
            LEFT JOIN (SELECT COUNT(*) as count FROM instructor_bootcamps WHERE bootcamp_id = $1) i ON true
            LEFT JOIN (SELECT COUNT(*) as count FROM units WHERE bootcamp_id = $1) u ON true
        """
        
        counts = await pool.fetchrow(counts_query, bootcamp_id)
        
        # Determine status
        today = date.today()
        if today < updated['start_date']:
            status = 'upcoming'
        elif today > updated['end_date']:
            status = 'completed'
        else:
            status = 'active'
        
        return BootcampRow(
            bootcamp_id=updated['bootcamp_id'],
            bootcamp_name=updated['bootcamp_name'],
            start_date=updated['start_date'],
            end_date=updated['end_date'],
            allow_multiple_instructors=updated['allow_multiple_instructors'],
            max_instructors=updated['max_instructors'],
            description=updated['description'],
            status=status,
            student_count=counts['student_count'],
            instructor_count=counts['instructor_count'],
            unit_count=counts['unit_count']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update bootcamp: {str(e)}"
        )