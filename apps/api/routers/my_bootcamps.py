from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from datetime import date
import asyncpg

from core.deps import get_current_user
from core.rbac import is_instructor
from db.pool import get_pool
from models.schemas import MyBootcampsList, MyBootcampRow

router = APIRouter()


@router.get("", response_model=MyBootcampsList)
async def get_my_bootcamps(
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get bootcamps assigned to the current instructor.
    
    Only accessible by instructors. Admins should use /bootcamps endpoint.
    """
    pool = get_pool()
    
    # Only instructors can access this endpoint
    if not is_instructor(user):
        raise HTTPException(
            status_code=403,
            detail="Only instructors can access my bootcamps. Admins should use /bootcamps endpoint."
        )
    
    try:
        query = """
            SELECT 
                b.bootcamp_id,
                b.bootcamp_name,
                b.start_date,
                b.end_date,
                ib.is_primary,
                -- Determine status based on dates
                CASE 
                    WHEN CURRENT_DATE < b.start_date THEN 'upcoming'
                    WHEN CURRENT_DATE > b.end_date THEN 'completed'
                    ELSE 'active'
                END as status,
                -- Count students
                COALESCE(student_counts.student_count, 0) as student_count,
                -- Count units
                COALESCE(unit_counts.unit_count, 0) as unit_count,
                -- Count assessments
                COALESCE(assessment_counts.assessment_count, 0) as assessment_count,
                -- Calculate average attendance (last 30 days)
                COALESCE(attendance_stats.avg_attendance, 0) as avg_attendance,
                -- Calculate average attention (last 30 days)
                COALESCE(attention_stats.avg_attention, 0) as avg_attention
            FROM instructor_bootcamps ib
            JOIN bootcamps b ON ib.bootcamp_id = b.bootcamp_id
            -- Student counts
            LEFT JOIN (
                SELECT 
                    bootcamp_id, 
                    COUNT(*) as student_count
                FROM students 
                GROUP BY bootcamp_id
            ) student_counts ON b.bootcamp_id = student_counts.bootcamp_id
            -- Unit counts
            LEFT JOIN (
                SELECT 
                    bootcamp_id, 
                    COUNT(*) as unit_count
                FROM units 
                GROUP BY bootcamp_id
            ) unit_counts ON b.bootcamp_id = unit_counts.bootcamp_id
            -- Assessment counts
            LEFT JOIN (
                SELECT 
                    u.bootcamp_id, 
                    COUNT(a.assessment_id) as assessment_count
                FROM assessments a
                JOIN units u ON a.unit_id = u.unit_id
                GROUP BY u.bootcamp_id
            ) assessment_counts ON b.bootcamp_id = assessment_counts.bootcamp_id
            -- Attendance stats (last 30 days)
            LEFT JOIN (
                SELECT 
                    bootcamp_id,
                    AVG(attendance_pct) as avg_attendance
                FROM class_samples
                WHERE date >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY bootcamp_id
            ) attendance_stats ON b.bootcamp_id = attendance_stats.bootcamp_id
            -- Attention stats (last 30 days)
            LEFT JOIN (
                SELECT 
                    bootcamp_id,
                    AVG(avg_attention_rate) as avg_attention
                FROM class_samples
                WHERE date >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY bootcamp_id
            ) attention_stats ON b.bootcamp_id = attention_stats.bootcamp_id
            WHERE ib.instructor_id = $1
            ORDER BY 
                ib.is_primary DESC,  -- Primary assignments first
                b.start_date DESC    -- Most recent first
        """
        
        rows = await pool.fetch(query, user["user_id"])
        
        items = [
            MyBootcampRow(
                bootcamp_id=row['bootcamp_id'],
                bootcamp_name=row['bootcamp_name'],
                start_date=row['start_date'],
                end_date=row['end_date'],
                is_primary=row['is_primary'],
                status=row['status'],
                student_count=row['student_count'],
                unit_count=row['unit_count'],
                assessment_count=row['assessment_count'],
                avg_attendance=round(float(row['avg_attendance']), 1) if row['avg_attendance'] else None,
                avg_attention=round(float(row['avg_attention']), 1) if row['avg_attention'] else None
            )
            for row in rows
        ]
        
        return MyBootcampsList(
            items=items,
            total=len(items)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch bootcamps: {str(e)}"
        )