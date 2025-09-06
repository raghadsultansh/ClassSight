from fastapi import APIRouter, Depends, Query, HTTPException, Path
from typing import Dict, Any, Optional
import asyncpg
from statistics import mean

from core.deps import get_current_user, assert_bootcamp_scope, get_instructor_bootcamp_ids
from core.rbac import is_admin, is_instructor
from db.pool import get_pool
from utils.pagination import parse_pagination_params
from models.schemas import GradesList, GradeRow, GradePatch

router = APIRouter()


@router.get("", response_model=GradesList)
async def get_grades(
    bootcamp_id: Optional[int] = Query(None, description="Filter by bootcamp"),
    unit_id: Optional[int] = Query(None, description="Filter by unit"),
    top: Optional[bool] = Query(None, description="Show only top performers"),
    worst: Optional[bool] = Query(None, description="Show only worst performers"),
    min_avg: Optional[float] = Query(None, description="Minimum average score filter"),
    page: Optional[int] = Query(1, ge=1),
    page_size: Optional[int] = Query(20, ge=1, le=100),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get paginated list of grades with filtering and statistics.
    
    - Admin: can view all grades
    - Instructor: can only view grades for assigned bootcamps
    """
    pool = get_pool()
    
    # Check bootcamp access
    await assert_bootcamp_scope(user, bootcamp_id, pool)
    
    # Get bootcamp filter for instructors
    bootcamp_filter = []
    if is_instructor(user):
        if bootcamp_id:
            bootcamp_filter = [bootcamp_id]
        else:
            bootcamp_filter = await get_instructor_bootcamp_ids(user["user_id"], pool)
            if not bootcamp_filter:
                return GradesList(items=[], page=1, page_size=page_size, total=0, stats={})
    elif bootcamp_id:
        bootcamp_filter = [bootcamp_id]
    
    # Parse pagination
    pagination = parse_pagination_params(page, page_size)
    
    # Build query conditions
    conditions = []
    params = []
    
    if bootcamp_filter:
        conditions.append(f"b.bootcamp_id = ANY(${len(params) + 1})")
        params.append(bootcamp_filter)
    
    if unit_id:
        conditions.append(f"u.unit_id = ${len(params) + 1}")
        params.append(unit_id)
    
    base_where = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    # Calculate statistics first (max_score is in assessments table)
    stats_query = f"""
        SELECT 
            AVG(g.score::float / a.max_score * 100) as avg_percentage,
            MIN(g.score::float / a.max_score * 100) as min_percentage,
            MAX(g.score::float / a.max_score * 100) as max_percentage,
            COUNT(*) as total_grades
        FROM grades g
        JOIN assessments a ON g.assessment_id = a.assessment_id
        JOIN units u ON a.unit_id = u.unit_id
        JOIN bootcamps b ON u.bootcamp_id = b.bootcamp_id
        {base_where}
    """
    
    stats_result = await pool.fetchrow(stats_query, *params)
    stats = {
        'avg': round(float(stats_result['avg_percentage'] or 0), 1),
        'min': round(float(stats_result['min_percentage'] or 0), 1),
        'max': round(float(stats_result['max_percentage'] or 0), 1),
        'count': stats_result['total_grades'] or 0
    }
    
    # Apply additional filters to WHERE clause
    additional_conditions = []
    if top is True:
        # Top 25% of performers
        additional_conditions.append("(g.score::float / a.max_score * 100) >= $" + str(len(params) + 1))
        params.append(75.0)  # Top quartile
    elif worst is True:
        # Bottom 25% of performers
        additional_conditions.append("(g.score::float / a.max_score * 100) <= $" + str(len(params) + 1))
        params.append(25.0)  # Bottom quartile
    
    if min_avg is not None:
        additional_conditions.append("(g.score::float / a.max_score * 100) >= $" + str(len(params) + 1))
        params.append(min_avg)
    
    # Add additional conditions to base WHERE clause
    if additional_conditions:
        base_where = base_where + " AND " + " AND ".join(additional_conditions)
    
    having_clause = ""
    
    # Get paginated results  
    query = f"""
        SELECT 
            g.grade_id,
            g.student_id,
            s.full_name as student_name,
            g.assessment_id,
            a.title as assessment_title,
            u.unit_id,
            u.unit_title as unit_name,
            g.score,
            a.max_score,
            a.weight,
            a.due_date,
            b.bootcamp_id,
            b.bootcamp_name,
            g.created_at as submitted_at,
            (g.score::float / a.max_score * 100) as percentage
        FROM grades g
        JOIN assessments a ON g.assessment_id = a.assessment_id
        JOIN students s ON g.student_id = s.student_id
        JOIN units u ON a.unit_id = u.unit_id
        JOIN bootcamps b ON u.bootcamp_id = b.bootcamp_id
        {base_where}
        ORDER BY g.created_at DESC, g.grade_id DESC
        LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
    """
    
    params.extend([pagination['limit'], pagination['offset']])
    rows = await pool.fetch(query, *params)
    
    items = [
        GradeRow(
            grade_id=row['grade_id'],
            student_id=row['student_id'],
            student_name=row['student_name'],
            assessment_id=row['assessment_id'],
            assessment_title=row['assessment_title'],
            unit_id=row['unit_id'],
            unit_name=row['unit_name'],
            score=row['score'],
            max_score=row['max_score'],
            weight=float(row['weight']),
            due_date=row['due_date'],
            bootcamp_id=row['bootcamp_id'],
            bootcamp_name=row['bootcamp_name'],
            submitted_at=row['submitted_at']
        )
        for row in rows
    ]
    
    return GradesList(
        items=items,
        page=pagination['page'],
        page_size=pagination['page_size'],
        total=len(items),  # This is approximate for performance
        stats=stats
    )


@router.patch("/{grade_id}")
async def update_grade(
    grade_id: int = Path(..., description="Grade ID to update"),
    grade_data: GradePatch = ...,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update a grade score.
    
    - Admin: view-only, cannot update grades
    - Instructor: can update grades only in their assigned bootcamps
    """
    pool = get_pool()
    
    # Admin cannot update grades (view-only)
    if is_admin(user):
        raise HTTPException(
            status_code=403,
            detail="Administrators have view-only access to grades"
        )
    
    # Only instructors can update
    if not is_instructor(user):
        raise HTTPException(
            status_code=403,
            detail="Only instructors can update grades"
        )
    
    try:
        # First, get the grade and verify instructor has access to the bootcamp
        grade_query = """
            SELECT 
                g.grade_id,
                a.max_score,
                b.bootcamp_id,
                b.bootcamp_name
            FROM grades g
            JOIN assessments a ON g.assessment_id = a.assessment_id
            JOIN units u ON a.unit_id = u.unit_id
            JOIN bootcamps b ON u.bootcamp_id = b.bootcamp_id
            WHERE g.grade_id = $1
        """
        
        grade_info = await pool.fetchrow(grade_query, grade_id)
        
        if not grade_info:
            raise HTTPException(status_code=404, detail="Grade not found")
        
        # Check if instructor has access to this bootcamp
        await assert_bootcamp_scope(user, grade_info['bootcamp_id'], pool)
        
        # Validate score range
        if grade_data.score > grade_info['max_score']:
            raise HTTPException(
                status_code=400,
                detail=f"Score cannot exceed maximum score of {grade_info['max_score']}"
            )
        
        # Update the grade (grades table doesn't have updated_at in schema)
        update_query = """
            UPDATE grades 
            SET score = $1
            WHERE grade_id = $2
            RETURNING score
        """
        
        result = await pool.fetchrow(update_query, grade_data.score, grade_id)
        
        return {
            "grade_id": grade_id,
            "score": result['score'],
            "max_score": grade_info['max_score'],
            "percentage": round((result['score'] / grade_info['max_score']) * 100, 1),
            "message": "Grade updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update grade: {str(e)}"
        )