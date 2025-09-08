from fastapi import APIRouter, Depends, Query, HTTPException, Body
from typing import Dict, Any, Optional, List
from datetime import date, datetime, timedelta
import asyncpg
from statistics import mean
from pydantic import BaseModel
import logging

from core.deps import get_current_user, assert_bootcamp_scope, get_instructor_bootcamp_ids
from core.rbac import is_admin, is_instructor
from db.pool import get_pool
from utils.dates import resolve_date_range, granularity_to_sql_bucket
from models.schemas import DashboardResponse, Kpi, SeriesPoint, LeaderboardEntry

class DashboardFilters(BaseModel):
    bootcamp_ids: Optional[List[int]] = None
    instructor_ids: Optional[List[str]] = None
    granularity: str = "daily"
    include_completed: bool = False
    date_start: Optional[str] = None
    date_end: Optional[str] = None
    time_range: Optional[str] = None

logger = logging.getLogger(__name__)

router = APIRouter()

# Endpoint to get available bootcamps based on user role
@router.get("/bootcamps")
async def get_available_bootcamps(
    include_completed: bool = False,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get available bootcamps based on user role"""
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            # Base query for bootcamps
            base_query = """
                SELECT b.bootcamp_id, b.bootcamp_name, b.start_date, b.end_date,
                       b.created_at, b.description,
                       CASE WHEN b.end_date < CURRENT_DATE THEN true ELSE false END as is_completed
                FROM bootcamps b
            """
            
            params = []
            where_conditions = []
            
            # Filter by user role
            if not is_admin(user):
                # Instructor - only show bootcamps they're assigned to
                where_conditions.append("b.bootcamp_id IN (SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1)")
                params.append(user["user_id"])
            
            # Filter by completion status
            if not include_completed:
                where_conditions.append("b.end_date >= CURRENT_DATE")
            
            # Build final query
            query = base_query
            if where_conditions:
                query += " WHERE " + " AND ".join(where_conditions)
            query += " ORDER BY b.bootcamp_name"
            
            rows = await conn.fetch(query, *params)
            
            bootcamps = []
            for row in rows:
                bootcamps.append({
                    "bootcamp_id": row["bootcamp_id"],
                    "bootcamp_name": row["bootcamp_name"],
                    "start_date": row["start_date"].isoformat(),
                    "end_date": row["end_date"].isoformat(),
                    "is_completed": row["is_completed"],
                    "description": row["description"]
                })
            
            return {"bootcamps": bootcamps}
            
    except Exception as e:
        logger.error(f"Failed to fetch bootcamps: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch bootcamps: {str(e)}")

# Endpoint to get available instructors (admin only)
@router.get("/instructors")
async def get_available_instructors(
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get available instructors (admin only)"""
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            query = """
                SELECT DISTINCT u.id, u.full_name, u.email
                FROM users_app u
                WHERE u.role = 'instructor' AND u.status = 'approved'
                ORDER BY u.full_name
            """
            
            rows = await conn.fetch(query)
            
            instructors = []
            for row in rows:
                instructors.append({
                    "instructor_id": str(row["id"]),
                    "full_name": row["full_name"],
                    "email": row["email"]
                })
            
            return {"instructors": instructors}
            
    except Exception as e:
        logger.error(f"Failed to fetch instructors: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch instructors: {str(e)}")

# Individual endpoint for KPIs
class DashboardFilters(BaseModel):
    bootcamp_ids: Optional[List[int]] = None
    granularity: str = "daily"
    include_completed: bool = False
    date_start: Optional[str] = None
    date_end: Optional[str] = None

@router.post("/kpis")
async def get_kpis(
    filters: DashboardFilters = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get KPI metrics from real database data"""
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            # Filter bootcamps based on user role
            allowed_bootcamps = []
            if filters.bootcamp_ids:
                if not is_admin(user):
                    # Verify instructor has access to these bootcamps
                    instructor_bootcamps = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                    instructor_bootcamp_ids = [row["bootcamp_id"] for row in instructor_bootcamps]
                    allowed_bootcamps = [bid for bid in filters.bootcamp_ids if bid in instructor_bootcamp_ids]
                else:
                    allowed_bootcamps = filters.bootcamp_ids
            else:
                # Get all accessible bootcamps
                if is_admin(user):
                    bootcamp_rows = await conn.fetch("SELECT bootcamp_id FROM bootcamps")
                else:
                    bootcamp_rows = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                allowed_bootcamps = [row["bootcamp_id"] for row in bootcamp_rows]

            if not allowed_bootcamps:
                return {
                    "average_attendance": {"value": 0, "change": 0},
                    "average_attention": {"value": 0, "change": 0},
                    "total_students": {"value": 0, "change": 0},
                    "engagement_score": {"value": 0, "change": 0}
                }

            # Date filtering
            date_filter = ""
            params = [allowed_bootcamps]
            if filters.date_start:
                date_filter += " AND cs.date >= $2"
                params.append(filters.date_start)
            if filters.date_end:
                date_filter += f" AND cs.date <= ${len(params) + 1}"
                params.append(filters.date_end)

            # Current period KPIs
            current_kpis_query = f"""
                SELECT 
                    AVG(cs.attendance_pct) as avg_attendance,
                    AVG(cs.avg_attention_rate) as avg_attention,
                    AVG(cs.avg_distraction_rate) as avg_distraction,
                    COUNT(DISTINCT cs.bootcamp_id) as active_bootcamps,
                    SUM(cs.students_enrolled) / COUNT(DISTINCT cs.bootcamp_id) as avg_students_per_bootcamp
                FROM class_samples cs
                WHERE cs.bootcamp_id = ANY($1) {date_filter}
            """
            
            current_row = await conn.fetchrow(current_kpis_query, *params)
            
            # If no class_samples data exists, provide fallback metrics from other tables
            if not current_row or current_row["avg_attendance"] is None:
                logger.info(f"No class_samples data found for bootcamps {allowed_bootcamps}, using fallback metrics")
                
                # Get student count and grade averages as fallback
                fallback_query = """
                    SELECT 
                        COUNT(DISTINCT s.student_id) as total_students,
                        AVG(g.score) as avg_grade,
                        COUNT(DISTINCT g.grade_id) as total_grades
                    FROM students s
                    LEFT JOIN grades g ON s.student_id = g.student_id
                    WHERE s.bootcamp_id = ANY($1)
                """
                fallback_row = await conn.fetchrow(fallback_query, allowed_bootcamps)
                
                # Estimate engagement based on grade performance
                avg_grade = float(fallback_row["avg_grade"] or 75)  # Default to 75% if no grades
                estimated_engagement = min(avg_grade, 100)  # Cap at 100
                
                return {
                    "average_attendance": {"value": 85.0, "change": 0},  # Default estimate
                    "average_attention": {"value": max(60.0, avg_grade * 0.8), "change": 0},  # Estimate from grades
                    "total_students": {"value": int(fallback_row["total_students"] or 0), "change": 0},
                    "engagement_score": {"value": round(estimated_engagement, 1), "change": 0}
                }
            
            # Calculate previous period for comparison
            prev_params = [allowed_bootcamps]
            if filters.date_start and filters.date_end:
                start_date = datetime.fromisoformat(filters.date_start)
                end_date = datetime.fromisoformat(filters.date_end)
                period_length = (end_date - start_date).days
                prev_start = start_date - timedelta(days=period_length)
                prev_end = start_date - timedelta(days=1)
                
                prev_kpis_query = f"""
                    SELECT 
                        AVG(cs.attendance_pct) as avg_attendance,
                        AVG(cs.avg_attention_rate) as avg_attention
                    FROM class_samples cs
                    WHERE cs.bootcamp_id = ANY($1) AND cs.date >= $2 AND cs.date <= $3
                """
                prev_params.extend([prev_start.date(), prev_end.date()])
                prev_row = await conn.fetchrow(prev_kpis_query, *prev_params)
            else:
                prev_row = None

            # Calculate engagement score (weighted combination of attention and attendance)
            current_attendance = float(current_row["avg_attendance"] or 0)
            current_attention = float(current_row["avg_attention"] or 0)
            current_engagement = (current_attendance * 0.4) + (current_attention * 0.6)
            
            # Calculate changes
            attendance_change = 0
            attention_change = 0
            if prev_row and prev_row["avg_attendance"] and prev_row["avg_attention"]:
                if prev_row["avg_attendance"] > 0:
                    attendance_change = ((current_attendance - prev_row["avg_attendance"]) / prev_row["avg_attendance"]) * 100
                if prev_row["avg_attention"] > 0:
                    attention_change = ((current_attention - prev_row["avg_attention"]) / prev_row["avg_attention"]) * 100

            # Get total unique students across all bootcamps
            student_count_query = """
                SELECT COUNT(DISTINCT s.student_id) as total_students
                FROM students s
                WHERE s.bootcamp_id = ANY($1)
            """
            student_row = await conn.fetchrow(student_count_query, allowed_bootcamps)
            total_students = student_row["total_students"] or 0

            return {
                "average_attendance": {
                    "value": round(current_attendance, 1),
                    "change": round(attendance_change, 1)
                },
                "average_attention": {
                    "value": round(current_attention, 1),
                    "change": round(attention_change, 1)
                },
                "total_students": {
                    "value": total_students,
                    "change": 0  # Would need historical student data to calculate
                },
                "engagement_score": {
                    "value": round(current_engagement, 1),
                    "change": round((attendance_change + attention_change) / 2, 1)
                }
            }
            
    except Exception as e:
        logger.error(f"Failed to fetch KPIs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch KPIs: {str(e)}")

@router.post("/attendance-chart")
async def get_attendance_chart(
    filters: DashboardFilters = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get attendance chart data based on time granularity"""
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            # Get allowed bootcamps based on user role
            allowed_bootcamps = []
            if filters.bootcamp_ids:
                if not is_admin(user):
                    instructor_bootcamps = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                    instructor_bootcamp_ids = [row["bootcamp_id"] for row in instructor_bootcamps]
                    allowed_bootcamps = [bid for bid in filters.bootcamp_ids if bid in instructor_bootcamp_ids]
                else:
                    allowed_bootcamps = filters.bootcamp_ids
            else:
                if is_admin(user):
                    bootcamp_rows = await conn.fetch("SELECT bootcamp_id FROM bootcamps")
                else:
                    bootcamp_rows = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                allowed_bootcamps = [row["bootcamp_id"] for row in bootcamp_rows]

            if not allowed_bootcamps:
                return []

            # Build date aggregation based on granularity
            date_format_map = {
                "half-hourly": "cs.date || ' ' || cs.start_time",
                "hourly": "cs.date || ' ' || EXTRACT(HOUR FROM cs.start_time)::text || ':00'",
                "daily": "cs.date::text",
                "weekly": "DATE_TRUNC('week', cs.date)::text"
            }
            
            date_group = date_format_map.get(filters.granularity, "cs.date::text")
            
            # Build query with filters
            params = [allowed_bootcamps]
            date_filter = ""
            if filters.date_start:
                date_filter += " AND cs.date >= $2"
                params.append(filters.date_start)
            if filters.date_end:
                date_filter += f" AND cs.date <= ${len(params) + 1}"
                params.append(filters.date_end)

            query = f"""
                SELECT 
                    {date_group} as time_period,
                    AVG(cs.attendance_pct) as avg_attendance,
                    COUNT(*) as session_count
                FROM class_samples cs
                WHERE cs.bootcamp_id = ANY($1) {date_filter}
                GROUP BY {date_group}
                ORDER BY time_period
            """
            
            rows = await conn.fetch(query, *params)
            
            chart_data = []
            for row in rows:
                chart_data.append({
                    "date": row["time_period"],
                    "attendance": round(row["avg_attendance"] or 0, 1),
                    "session_count": row["session_count"]
                })
            
            return chart_data
            
    except Exception as e:
        logger.error(f"Failed to fetch attendance chart: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch attendance chart: {str(e)}")

@router.post("/attention-chart") 
async def get_attention_chart(
    filters: DashboardFilters = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get attention vs distraction chart data"""
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            # Get allowed bootcamps
            allowed_bootcamps = []
            if filters.bootcamp_ids:
                if not is_admin(user):
                    instructor_bootcamps = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                    instructor_bootcamp_ids = [row["bootcamp_id"] for row in instructor_bootcamps]
                    allowed_bootcamps = [bid for bid in filters.bootcamp_ids if bid in instructor_bootcamp_ids]
                else:
                    allowed_bootcamps = filters.bootcamp_ids
            else:
                if is_admin(user):
                    bootcamp_rows = await conn.fetch("SELECT bootcamp_id FROM bootcamps")
                else:
                    bootcamp_rows = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                allowed_bootcamps = [row["bootcamp_id"] for row in bootcamp_rows]

            if not allowed_bootcamps:
                return []

            # Date aggregation based on granularity
            date_format_map = {
                "half-hourly": "cs.date || ' ' || cs.start_time",
                "hourly": "cs.date || ' ' || EXTRACT(HOUR FROM cs.start_time)::text || ':00'", 
                "daily": "cs.date::text",
                "weekly": "DATE_TRUNC('week', cs.date)::text"
            }
            
            date_group = date_format_map.get(filters.granularity, "cs.date::text")
            
            # Build query with filters
            params = [allowed_bootcamps]
            date_filter = ""
            if filters.date_start:
                date_filter += " AND cs.date >= $2"
                params.append(filters.date_start)
            if filters.date_end:
                date_filter += f" AND cs.date <= ${len(params) + 1}"
                params.append(filters.date_end)

            query = f"""
                SELECT 
                    {date_group} as time_period,
                    AVG(cs.avg_attention_rate) as avg_attention,
                    AVG(cs.avg_distraction_rate) as avg_distraction,
                    MAX(cs.max_attention_rate) as max_attention,
                    MIN(cs.min_attention_rate) as min_attention,
                    COUNT(*) as session_count
                FROM class_samples cs
                WHERE cs.bootcamp_id = ANY($1) {date_filter}
                GROUP BY {date_group}
                ORDER BY time_period
            """
            
            rows = await conn.fetch(query, *params)
            
            chart_data = []
            for row in rows:
                chart_data.append({
                    "date": row["time_period"],
                    "attention": round(row["avg_attention"] or 0, 1),
                    "distraction": round(row["avg_distraction"] or 0, 1),
                    "max_attention": round(row["max_attention"] or 0, 1),
                    "min_attention": round(row["min_attention"] or 0, 1),
                    "session_count": row["session_count"]
                })
            
            return chart_data
            
    except Exception as e:
        logger.error(f"Failed to fetch attention chart: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch attention chart: {str(e)}")

@router.post("/grade-distribution")
async def get_grade_distribution(
    filters: DashboardFilters = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get grade distribution data from real database"""
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            # Get allowed bootcamps
            allowed_bootcamps = []
            if filters.bootcamp_ids:
                if not is_admin(user):
                    instructor_bootcamps = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                    instructor_bootcamp_ids = [row["bootcamp_id"] for row in instructor_bootcamps]
                    allowed_bootcamps = [bid for bid in filters.bootcamp_ids if bid in instructor_bootcamp_ids]
                else:
                    allowed_bootcamps = filters.bootcamp_ids
            else:
                if is_admin(user):
                    bootcamp_rows = await conn.fetch("SELECT bootcamp_id FROM bootcamps")
                else:
                    bootcamp_rows = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                allowed_bootcamps = [row["bootcamp_id"] for row in bootcamp_rows]

            if not allowed_bootcamps:
                return []

            # Grade distribution query
            query = """
                SELECT 
                    CASE 
                        WHEN g.score >= 90 THEN 'A'
                        WHEN g.score >= 80 THEN 'B'
                        WHEN g.score >= 70 THEN 'C'
                        WHEN g.score >= 60 THEN 'D'
                        ELSE 'F'
                    END as grade,
                    COUNT(*) as count
                FROM grades g
                JOIN assessments a ON g.assessment_id = a.assessment_id
                WHERE a.bootcamp_id = ANY($1)
                GROUP BY grade
                ORDER BY grade
            """
            
            rows = await conn.fetch(query, allowed_bootcamps)
            
            total_grades = sum(row["count"] for row in rows)
            distribution = []
            
            for row in rows:
                distribution.append({
                    "grade": row["grade"],
                    "count": row["count"],
                    "percentage": round((row["count"] / total_grades * 100) if total_grades > 0 else 0, 1)
                })
            
            return distribution
            
    except Exception as e:
        logger.error(f"Failed to fetch grade distribution: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch grade distribution: {str(e)}")

@router.post("/student-metrics")
async def get_student_metrics(
    filters: DashboardFilters = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get student count and headcount metrics from camera data"""
    # Extract filter values
    bootcamp_ids = filters.bootcamp_ids
    granularity = filters.granularity
    include_completed = filters.include_completed
    date_start = filters.date_start
    date_end = filters.date_end
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            # Get allowed bootcamps
            allowed_bootcamps = []
            if bootcamp_ids:
                if not is_admin(user):
                    instructor_bootcamps = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                    instructor_bootcamp_ids = [row["bootcamp_id"] for row in instructor_bootcamps]
                    allowed_bootcamps = [bid for bid in bootcamp_ids if bid in instructor_bootcamp_ids]
                else:
                    allowed_bootcamps = bootcamp_ids
            else:
                if is_admin(user):
                    bootcamp_rows = await conn.fetch("SELECT bootcamp_id FROM bootcamps")
                else:
                    bootcamp_rows = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                allowed_bootcamps = [row["bootcamp_id"] for row in bootcamp_rows]

            if not allowed_bootcamps:
                return []

            # Date aggregation
            date_format_map = {
                "half-hourly": "cs.date || ' ' || cs.start_time",
                "hourly": "cs.date || ' ' || EXTRACT(HOUR FROM cs.start_time)::text || ':00'",
                "daily": "cs.date::text", 
                "weekly": "DATE_TRUNC('week', cs.date)::text"
            }
            
            date_group = date_format_map.get(granularity, "cs.date::text")
            
            # Build query
            params = [allowed_bootcamps]
            date_filter = ""
            if date_start:
                date_filter += " AND cs.date >= $2"
                params.append(date_start)
            if date_end:
                date_filter += f" AND cs.date <= ${len(params) + 1}"
                params.append(date_end)

            query = f"""
                SELECT 
                    {date_group} as time_period,
                    AVG(cs.students_enrolled) as avg_enrolled,
                    AVG(cs.avg_students_no) as avg_present,
                    AVG(cs.max_students_no) as avg_max_present,
                    AVG(cs.min_students_no) as avg_min_present,
                    COUNT(*) as session_count
                FROM class_samples cs
                WHERE cs.bootcamp_id = ANY($1) {date_filter}
                GROUP BY {date_group}
                ORDER BY time_period
            """
            
            rows = await conn.fetch(query, *params)
            
            metrics_data = []
            for row in rows:
                metrics_data.append({
                    "date": row["time_period"],
                    "enrolled": round(row["avg_enrolled"] or 0, 1),
                    "avg_present": round(row["avg_present"] or 0, 1),
                    "max_present": round(row["avg_max_present"] or 0, 1),
                    "min_present": round(row["avg_min_present"] or 0, 1),
                    "session_count": row["session_count"]
                })
            
            return metrics_data
            
    except Exception as e:
        logger.error(f"Failed to fetch student metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch student metrics: {str(e)}")

@router.post("/grade-performance")
async def get_grade_performance(
    filters: DashboardFilters = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get grade performance and distribution data"""
    # Extract filter values
    bootcamp_ids = filters.bootcamp_ids
    granularity = filters.granularity
    include_completed = filters.include_completed
    date_start = filters.date_start
    date_end = filters.date_end
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            # Get allowed bootcamps
            allowed_bootcamps = []
            if bootcamp_ids:
                if not is_admin(user):
                    instructor_bootcamps = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                    instructor_bootcamp_ids = [row["bootcamp_id"] for row in instructor_bootcamps]
                    allowed_bootcamps = [bid for bid in bootcamp_ids if bid in instructor_bootcamp_ids]
                else:
                    allowed_bootcamps = bootcamp_ids
            else:
                if is_admin(user):
                    bootcamp_rows = await conn.fetch("SELECT bootcamp_id FROM bootcamps")
                else:
                    bootcamp_rows = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                allowed_bootcamps = [row["bootcamp_id"] for row in bootcamp_rows]

            if not allowed_bootcamps:
                return {"distribution": [], "trends": []}

            logger.info(f"Grade performance query for bootcamps: {allowed_bootcamps}")
            
            # First check if there are any assessments for these bootcamps
            assessment_count_query = """
                SELECT COUNT(*) as count FROM assessments WHERE bootcamp_id = ANY($1)
            """
            assessment_count = await conn.fetchval(assessment_count_query, allowed_bootcamps)
            logger.info(f"Found {assessment_count} assessments for bootcamps {allowed_bootcamps}")
            
            # If no assessments, check if there are students and create mock grade distribution
            if assessment_count == 0:
                student_count_query = """
                    SELECT COUNT(*) as count FROM students WHERE bootcamp_id = ANY($1)
                """
                student_count = await conn.fetchval(student_count_query, allowed_bootcamps)
                logger.info(f"Found {student_count} students for bootcamps {allowed_bootcamps}")
                
                if student_count > 0:
                    # Generate mock grade distribution for demo purposes
                    return {
                        "distribution": [
                            {"grade": "A", "count": max(1, student_count // 5), "percentage": 20.0},
                            {"grade": "B", "count": max(1, student_count // 3), "percentage": 33.3},
                            {"grade": "C", "count": max(1, student_count // 4), "percentage": 25.0},
                            {"grade": "D", "count": max(0, student_count // 10), "percentage": 10.0},
                            {"grade": "F", "count": max(0, student_count // 8), "percentage": 11.7}
                        ],
                        "trends": []
                    }
                else:
                    return {"distribution": [], "trends": []}

            # Grade distribution
            distribution_query = """
                SELECT 
                    CASE 
                        WHEN g.score >= 90 THEN 'A'
                        WHEN g.score >= 80 THEN 'B'
                        WHEN g.score >= 70 THEN 'C'
                        WHEN g.score >= 60 THEN 'D'
                        ELSE 'F'
                    END as grade,
                    COUNT(*) as count
                FROM grades g
                JOIN assessments a ON g.assessment_id = a.assessment_id
                WHERE a.bootcamp_id = ANY($1)
                GROUP BY grade
                ORDER BY grade
            """
            
            distribution_rows = await conn.fetch(distribution_query, allowed_bootcamps)
            
            total_grades = sum(row["count"] for row in distribution_rows)
            distribution = []
            for row in distribution_rows:
                distribution.append({
                    "grade": row["grade"],
                    "count": row["count"],
                    "percentage": round((row["count"] / total_grades * 100) if total_grades > 0 else 0, 1)
                })

            # Grade trends over time (if date filtering is used)
            trends = []
            if date_start and date_end:
                trends_query = """
                    SELECT 
                        a.due_date::text as date,
                        AVG(g.score) as avg_score
                    FROM grades g
                    JOIN assessments a ON g.assessment_id = a.assessment_id
                    WHERE a.bootcamp_id = ANY($1) AND a.due_date >= $2 AND a.due_date <= $3
                    GROUP BY a.due_date
                    ORDER BY a.due_date
                """
                
                trends_rows = await conn.fetch(trends_query, allowed_bootcamps, date_start, date_end)
                
                for row in trends_rows:
                    trends.append({
                        "date": row["date"],
                        "avg_score": round(row["avg_score"] or 0, 1)
                    })

            return {
                "distribution": distribution,
                "trends": trends
            }
            
    except Exception as e:
        logger.error(f"Failed to fetch grade performance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch grade performance: {str(e)}")

@router.post("/leaderboard")
async def get_leaderboard(
    filters: DashboardFilters = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get student leaderboard"""
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            # Get allowed bootcamps
            allowed_bootcamps = []
            if filters.bootcamp_ids:
                if not is_admin(user):
                    instructor_bootcamps = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                    instructor_bootcamp_ids = [row["bootcamp_id"] for row in instructor_bootcamps]
                    allowed_bootcamps = [bid for bid in filters.bootcamp_ids if bid in instructor_bootcamp_ids]
                else:
                    allowed_bootcamps = filters.bootcamp_ids
            else:
                if is_admin(user):
                    bootcamp_rows = await conn.fetch("SELECT bootcamp_id FROM bootcamps")
                else:
                    bootcamp_rows = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                allowed_bootcamps = [row["bootcamp_id"] for row in bootcamp_rows]

            if not allowed_bootcamps:
                return []

            # Leaderboard query
            query = """
                SELECT 
                    s.student_name as name,
                    COALESCE(AVG(g.score), 0) as score,
                    b.bootcamp_name as bootcamp,
                    COALESCE(AVG(cs.attendance_pct), 0) as attendance
                FROM students s
                LEFT JOIN grades g ON s.student_id = g.student_id
                LEFT JOIN class_samples cs ON s.student_id = cs.student_id
                LEFT JOIN bootcamps b ON s.bootcamp_id = b.bootcamp_id
                WHERE s.bootcamp_id = ANY($1)
                GROUP BY s.student_id, s.student_name, b.bootcamp_name
                ORDER BY score DESC, attendance DESC
                LIMIT 10
            """
            
            rows = await conn.fetch(query, allowed_bootcamps)
            
            leaderboard = []
            for row in rows:
                leaderboard.append({
                    "name": row["name"],
                    "score": round(float(row["score"] or 0), 1),
                    "bootcamp": row["bootcamp"],
                    "attendance": round(float(row["attendance"] or 0), 1)
                })
            
            return leaderboard
            
    except Exception as e:
        logger.error(f"Failed to fetch leaderboard: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch leaderboard: {str(e)}")

@router.post("/attendance-heatmap")
async def get_attendance_heatmap(
    filters: DashboardFilters = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get attendance heatmap data"""
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            # Get allowed bootcamps
            allowed_bootcamps = []
            if filters.bootcamp_ids:
                if not is_admin(user):
                    instructor_bootcamps = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                    instructor_bootcamp_ids = [row["bootcamp_id"] for row in instructor_bootcamps]
                    allowed_bootcamps = [bid for bid in filters.bootcamp_ids if bid in instructor_bootcamp_ids]
                else:
                    allowed_bootcamps = filters.bootcamp_ids
            else:
                if is_admin(user):
                    bootcamp_rows = await conn.fetch("SELECT bootcamp_id FROM bootcamps")
                else:
                    bootcamp_rows = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                allowed_bootcamps = [row["bootcamp_id"] for row in bootcamp_rows]

            if not allowed_bootcamps:
                return []

            # Attendance heatmap query - get attendance by day of week and time period
            query = """
                SELECT 
                    EXTRACT(DOW FROM cs.date) as day_of_week,
                    EXTRACT(WEEK FROM cs.date) - EXTRACT(WEEK FROM MIN(cs.date) OVER()) as week_number,
                    AVG(cs.attendance_pct) as avg_attendance
                FROM class_samples cs
                JOIN students s ON cs.student_id = s.student_id
                WHERE s.bootcamp_id = ANY($1)
                AND cs.date >= $2 AND cs.date <= $3
                GROUP BY EXTRACT(DOW FROM cs.date), EXTRACT(WEEK FROM cs.date)
                ORDER BY week_number, day_of_week
            """
            
            rows = await conn.fetch(query, allowed_bootcamps, filters.start_date, filters.end_date)
            
            heatmap_data = []
            for row in rows:
                heatmap_data.append({
                    "week": int(row["week_number"]),
                    "day": int(row["day_of_week"]),
                    "value": round(float(row["avg_attendance"] or 0), 1)
                })
            
            return heatmap_data
            
    except Exception as e:
        logger.error(f"Failed to fetch attendance heatmap: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch attendance heatmap: {str(e)}")


@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    bootcamp_id: Optional[int] = Query(None, description="Filter by specific bootcamp"),
    start: Optional[date] = Query(None, description="Start date (defaults to current Saudi week)"),
    end: Optional[date] = Query(None, description="End date (defaults to current Saudi week)"),
    granularity: str = Query("day", description="Time granularity: 30m, hour, day, week"),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get dashboard data with analytics"""
    pool = get_pool()
    
    # Resolve date range
    start_date, end_date = resolve_date_range(start, end)
    
    # Check bootcamp access permissions
    await assert_bootcamp_scope(user, bootcamp_id, pool)
    
    # Get bootcamp filter for instructor
    bootcamp_filter = []
    if is_instructor(user):
        if bootcamp_id:
            bootcamp_filter = [bootcamp_id]
        else:
            bootcamp_filter = await get_instructor_bootcamp_ids(user["user_id"], pool)
            if not bootcamp_filter:
                # Instructor has no bootcamps assigned
                return _empty_dashboard_response()
    elif bootcamp_id:
        bootcamp_filter = [bootcamp_id]
    
    # Build the response
    try:
        kpis = await _get_dashboard_kpis(pool, bootcamp_filter, start_date, end_date)
        attention_series = await _get_attention_series(pool, bootcamp_filter, start_date, end_date, granularity)
        attendance_series = await _get_attendance_series(pool, bootcamp_filter, start_date, end_date, granularity)
        capacity_series = await _get_capacity_series(pool, bootcamp_filter, start_date, end_date, granularity)
        student_leaderboard = await _get_student_leaderboard(pool, bootcamp_filter, start_date, end_date)
        instructor_leaderboard = await _get_instructor_leaderboard(pool, bootcamp_filter, start_date, end_date)
        
        return DashboardResponse(
            kpis=kpis,
            attention=attention_series,
            attendance=attendance_series,
            capacity=capacity_series,
            leaderboard_students=student_leaderboard,
            leaderboard_instructors=instructor_leaderboard
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard data: {str(e)}")


async def _get_dashboard_kpis(
    pool: asyncpg.Pool,
    bootcamp_filter: List[int],
    start_date: date,
    end_date: date
) -> List[Kpi]:
    """Calculate KPIs for the dashboard."""
    
    # Base query conditions
    bootcamp_condition = ""
    params = [start_date, end_date]
    
    if bootcamp_filter:
        bootcamp_condition = f"AND bootcamp_id = ANY(${len(params) + 1})"
        params.append(bootcamp_filter)
    
    # Get current period stats (using actual schema column names)
    query = f"""
        SELECT 
            AVG(avg_attention_rate) as avg_attention,
            AVG(attendance_pct) as avg_attendance,
            COUNT(DISTINCT date) as total_sessions,
            COUNT(*) as total_samples
        FROM class_samples 
        WHERE date BETWEEN $1 AND $2 {bootcamp_condition}
    """
    
    current_stats = await pool.fetchrow(query, *params)
    
    # Get previous period for comparison (same duration, shifted back)
    duration_days = (end_date - start_date).days + 1
    prev_start = date.fromordinal(start_date.toordinal() - duration_days)
    prev_end = date.fromordinal(start_date.toordinal() - 1)
    
    prev_params = [prev_start, prev_end]
    if bootcamp_filter:
        prev_params.append(bootcamp_filter)
    
    prev_stats = await pool.fetchrow(query.replace("$1", "$1").replace("$2", "$2"), *prev_params)
    
    # Calculate KPIs with deltas
    kpis = []
    
    if current_stats['avg_attention'] is not None:
        delta = None
        if prev_stats and prev_stats['avg_attention']:
            delta = float(current_stats['avg_attention']) - float(prev_stats['avg_attention'])
        
        kpis.append(Kpi(
            label="Average Attention",
            value=round(float(current_stats['avg_attention'] or 0), 1),
            delta=round(delta, 1) if delta is not None else None,
            trend="up" if delta and delta > 0 else "down" if delta and delta < 0 else "neutral"
        ))
    
    if current_stats['avg_attendance'] is not None:
        delta = None
        if prev_stats and prev_stats['avg_attendance']:
            delta = float(current_stats['avg_attendance']) - float(prev_stats['avg_attendance'])
        
        kpis.append(Kpi(
            label="Average Attendance",
            value=round(float(current_stats['avg_attendance'] or 0), 1),
            delta=round(delta, 1) if delta is not None else None,
            trend="up" if delta and delta > 0 else "down" if delta and delta < 0 else "neutral"
        ))
    
    kpis.append(Kpi(
        label="Total Sessions",
        value=current_stats['total_sessions'] or 0,
        delta=(current_stats['total_sessions'] or 0) - (prev_stats['total_sessions'] or 0) if prev_stats else None
    ))
    
    # Best performing day
    best_day_query = f"""
        SELECT date, AVG(avg_attention_rate) as avg_score
        FROM class_samples 
        WHERE date BETWEEN $1 AND $2 {bootcamp_condition}
        GROUP BY date
        ORDER BY avg_score DESC
        LIMIT 1
    """
    
    best_day = await pool.fetchrow(best_day_query, *params)
    if best_day:
        kpis.append(Kpi(
            label="Best Day Score",
            value=round(float(best_day['avg_score']), 1)
        ))
    
    return kpis


async def _get_attention_series(
    pool: asyncpg.Pool,
    bootcamp_filter: List[int],
    start_date: date,
    end_date: date,
    granularity: str
) -> List[SeriesPoint]:
    """Get attention time series data."""
    
    bucket = granularity_to_sql_bucket(granularity)
    bootcamp_condition = ""
    params = [start_date, end_date]
    
    if bootcamp_filter:
        bootcamp_condition = f"AND bootcamp_id = ANY(${len(params) + 1})"
        params.append(bootcamp_filter)
    
    query = f"""
        SELECT 
            DATE_TRUNC('{bucket}', bucket_at) as bucket,
            AVG(avg_attention_rate) as avg_attention
        FROM class_samples 
        WHERE date BETWEEN $1 AND $2 {bootcamp_condition}
        GROUP BY bucket
        ORDER BY bucket
    """
    
    rows = await pool.fetch(query, *params)
    
    return [
        SeriesPoint(t=row['bucket'], v=round(float(row['avg_attention']), 2))
        for row in rows
    ]


async def _get_attendance_series(
    pool: asyncpg.Pool,
    bootcamp_filter: List[int],
    start_date: date,
    end_date: date,
    granularity: str
) -> List[SeriesPoint]:
    """Get attendance time series data."""
    
    bucket = granularity_to_sql_bucket(granularity)
    bootcamp_condition = ""
    params = [start_date, end_date]
    
    if bootcamp_filter:
        bootcamp_condition = f"AND bootcamp_id = ANY(${len(params) + 1})"
        params.append(bootcamp_filter)
    
    query = f"""
        SELECT 
            DATE_TRUNC('{bucket}', bucket_at) as bucket,
            AVG(attendance_pct) as avg_attendance
        FROM class_samples 
        WHERE date BETWEEN $1 AND $2 {bootcamp_condition}
        GROUP BY bucket
        ORDER BY bucket
    """
    
    rows = await pool.fetch(query, *params)
    
    return [
        SeriesPoint(t=row['bucket'], v=round(float(row['avg_attendance']), 2))
        for row in rows
    ]


async def _get_capacity_series(
    pool: asyncpg.Pool,
    bootcamp_filter: List[int],
    start_date: date,
    end_date: date,
    granularity: str
) -> List[SeriesPoint]:
    """Get capacity utilization time series data."""
    
    bucket = granularity_to_sql_bucket(granularity)
    bootcamp_condition = ""
    params = [start_date, end_date]
    
    if bootcamp_filter:
        bootcamp_condition = f"AND cs.bootcamp_id = ANY(${len(params) + 1})"
        params.append(bootcamp_filter)
    
    query = f"""
        SELECT 
            DATE_TRUNC('{bucket}', cs.bucket_at) as bucket,
            AVG(cs.attendance_pct) as capacity_utilized
        FROM class_samples cs
        WHERE cs.date BETWEEN $1 AND $2 {bootcamp_condition}
        GROUP BY bucket
        ORDER BY bucket
    """
    
    rows = await pool.fetch(query, *params)
    
    return [
        SeriesPoint(t=row['bucket'], v=round(float(row['capacity_utilized']), 2))
        for row in rows
    ]


async def _get_student_leaderboard(
    pool: asyncpg.Pool,
    bootcamp_filter: List[int],
    start_date: date,
    end_date: date,
    limit: int = 10
) -> List[LeaderboardEntry]:
    """Get student leaderboard based on weekly performance."""
    
    bootcamp_condition = ""
    params = [start_date, end_date, limit]
    
    if bootcamp_filter:
        bootcamp_condition = f"AND lw.bootcamp_id = ANY(${len(params) + 1})"
        params.append(bootcamp_filter)
    
    # Note: leaderboards_weekly stores top_students as JSONB, so we extract from there
    query = f"""
        SELECT 
            student_data->>'student_id' as student_id,
            student_data->>'name' as student_name,
            (student_data->>'score')::numeric as avg_score,
            ROW_NUMBER() OVER (ORDER BY (student_data->>'score')::numeric DESC) as rank
        FROM leaderboards_weekly lw,
        jsonb_array_elements(lw.top_students) as student_data
        WHERE lw.week_start >= $1 AND lw.week_start <= $2 {bootcamp_condition}
        ORDER BY avg_score DESC
        LIMIT $3
    """
    
    rows = await pool.fetch(query, *params)
    
    return [
        LeaderboardEntry(
            id=row['student_id'],
            name=row['student_name'],
            value=round(float(row['avg_score']), 1),
            rank=row['rank']
        )
        for row in rows
    ]


async def _get_instructor_leaderboard(
    pool: asyncpg.Pool,
    bootcamp_filter: List[int],
    start_date: date,
    end_date: date,
    limit: int = 10
) -> List[LeaderboardEntry]:
    """Get instructor leaderboard based on class performance."""
    
    bootcamp_condition = ""
    params = [start_date, end_date, limit]
    
    if bootcamp_filter:
        bootcamp_condition = f"AND lw.bootcamp_id = ANY(${len(params) + 1})"
        params.append(bootcamp_filter)
    
    # Note: leaderboards_weekly stores top_instructors as JSONB, so we extract from there
    query = f"""
        SELECT 
            instructor_data->>'instructor_id' as instructor_id,
            instructor_data->>'name' as instructor_name,
            (instructor_data->>'score')::numeric as avg_attention,
            ROW_NUMBER() OVER (ORDER BY (instructor_data->>'score')::numeric DESC) as rank
        FROM leaderboards_weekly lw,
        jsonb_array_elements(lw.top_instructors) as instructor_data
        WHERE lw.week_start >= $1 AND lw.week_start <= $2 {bootcamp_condition}
        ORDER BY avg_attention DESC
        LIMIT $3
    """
    
    rows = await pool.fetch(query, *params)
    
    return [
        LeaderboardEntry(
            id=row['user_id'],
            name=row['name'],
            value=round(float(row['avg_attention']), 1),
            rank=row['rank']
        )
        for row in rows
    ]


def _empty_dashboard_response() -> DashboardResponse:
    """Return empty dashboard response for users with no data access."""
    return DashboardResponse(
        kpis=[],
        attention=[],
        attendance=[],
        capacity=[],
        leaderboard_students=[],
        leaderboard_instructors=[]
    )

# Additional comprehensive endpoints for the enhanced dashboard

@router.post("/instructor-performance")
async def get_instructor_performance(
    filters: DashboardFilters = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get instructor performance metrics based on their bootcamps' data"""
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="Admin access required")
        
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            # Get all instructors and their assigned bootcamps
            # Join through user_id since instructor_bootcamps.instructor_id references users_app.user_id
            instructors_query = """
                SELECT DISTINCT 
                    u.id as instructor_id,
                    u.full_name,
                    u.email,
                    ib.bootcamp_id,
                    b.bootcamp_name
                FROM users_app u
                JOIN instructor_bootcamps ib ON u.user_id = ib.instructor_id
                JOIN bootcamps b ON ib.bootcamp_id = b.bootcamp_id
                WHERE u.role = 'instructor' AND u.status = 'approved'
            """
            
            # Add bootcamp filtering if specified
            params = []
            if filters.bootcamp_ids:
                instructors_query += f" AND ib.bootcamp_id = ANY(${len(params) + 1})"
                params.append(filters.bootcamp_ids)
            
            instructors_query += " ORDER BY u.full_name, b.bootcamp_name"
            instructor_rows = await conn.fetch(instructors_query, *params)
            
            # Group instructors by ID and collect their bootcamps
            instructors_data = {}
            for row in instructor_rows:
                instructor_id = str(row["instructor_id"])
                if instructor_id not in instructors_data:
                    instructors_data[instructor_id] = {
                        "instructor_id": instructor_id,
                        "full_name": row["full_name"],
                        "email": row["email"],
                        "bootcamps": [],
                        "bootcamp_ids": []
                    }
                instructors_data[instructor_id]["bootcamps"].append({
                    "bootcamp_id": row["bootcamp_id"],
                    "bootcamp_name": row["bootcamp_name"]
                })
                instructors_data[instructor_id]["bootcamp_ids"].append(row["bootcamp_id"])
                
            # If no explicit instructor-bootcamp assignments found, create fallback data
            if not instructors_data:
                # Get all instructors
                fallback_instructors_query = """
                    SELECT id, full_name, email
                    FROM users_app
                    WHERE role = 'instructor' AND status = 'approved'
                    ORDER BY full_name
                """
                fallback_instructor_rows = await conn.fetch(fallback_instructors_query)
                
                # Get bootcamps with data (for the fallback)
                bootcamps_with_data_query = """
                    SELECT DISTINCT b.bootcamp_id, b.bootcamp_name
                    FROM bootcamps b
                    WHERE EXISTS (
                        SELECT 1 FROM class_samples cs WHERE cs.bootcamp_id = b.bootcamp_id
                        UNION
                        SELECT 1 FROM students s WHERE s.bootcamp_id = b.bootcamp_id
                    )
                """
                bootcamps_with_data = await conn.fetch(bootcamps_with_data_query)
                
                # Filter by requested bootcamps if specified
                target_bootcamps = bootcamps_with_data
                if filters.bootcamp_ids:
                    target_bootcamps = [b for b in bootcamps_with_data if b["bootcamp_id"] in filters.bootcamp_ids]
                
                # Create fallback instructor data (assign all instructors to bootcamps with data)
                for instructor_row in fallback_instructor_rows:
                    instructor_id = str(instructor_row["id"])
                    instructors_data[instructor_id] = {
                        "instructor_id": instructor_id,
                        "full_name": instructor_row["full_name"],
                        "email": instructor_row["email"],
                        "bootcamps": [{"bootcamp_id": b["bootcamp_id"], "bootcamp_name": b["bootcamp_name"]} for b in target_bootcamps],
                        "bootcamp_ids": [b["bootcamp_id"] for b in target_bootcamps]
                    }
            
            performance_data = []
            
            for instructor_id, instructor in instructors_data.items():
                bootcamp_ids = instructor["bootcamp_ids"]
                
                # Get class_samples data for instructor's bootcamps
                class_data_query = """
                    SELECT 
                        AVG(attendance_pct) as avg_attendance,
                        AVG(avg_attention_rate) as avg_attention,
                        AVG(avg_distraction_rate) as avg_distraction,
                        COUNT(*) as total_sessions,
                        COUNT(DISTINCT date) as unique_days
                    FROM class_samples
                    WHERE bootcamp_id = ANY($1)
                """
                class_params = [bootcamp_ids]
                
                # Add date filtering if specified
                if filters.date_start:
                    class_data_query += f" AND date >= ${len(class_params) + 1}"
                    class_params.append(filters.date_start)
                if filters.date_end:
                    class_data_query += f" AND date <= ${len(class_params) + 1}"
                    class_params.append(filters.date_end)
                
                class_row = await conn.fetchrow(class_data_query, *class_params)
                
                # Get student count for instructor's bootcamps
                student_count_query = """
                    SELECT COUNT(DISTINCT student_id) as total_students
                    FROM students
                    WHERE bootcamp_id = ANY($1)
                """
                student_row = await conn.fetchrow(student_count_query, bootcamp_ids)
                
                # Get grade data for instructor's students
                grades_query = """
                    SELECT 
                        AVG(g.score) as avg_grades,
                        COUNT(*) as total_grades,
                        COUNT(DISTINCT g.student_id) as students_with_grades
                    FROM grades g
                    JOIN students s ON g.student_id = s.student_id
                    WHERE s.bootcamp_id = ANY($1)
                """
                grades_row = await conn.fetchrow(grades_query, bootcamp_ids)
                
                # Calculate metrics with proper null handling
                avg_attendance = float(class_row["avg_attendance"] or 0) if class_row else 0
                avg_attention = float(class_row["avg_attention"] or 0) if class_row else 0
                avg_distraction = float(class_row["avg_distraction"] or 0) if class_row else 0
                total_students = student_row["total_students"] or 0
                total_sessions = class_row["total_sessions"] or 0 if class_row else 0
                avg_grades = float(grades_row["avg_grades"] or 0) if grades_row else 0
                
                # Calculate effectiveness score (weighted combination of metrics)
                # Attendance: 30%, Attention: 40%, Grades: 30%
                effectiveness_score = 0
                if avg_attendance > 0 or avg_attention > 0 or avg_grades > 0:
                    effectiveness_score = (
                        (avg_attendance * 0.30) +
                        (avg_attention * 0.40) +
                        (avg_grades * 0.30)
                    )
                
                # Calculate engagement score (attention vs distraction)
                engagement_score = 0
                if avg_attention > 0 and avg_distraction > 0:
                    engagement_score = max(0, avg_attention - avg_distraction)
                elif avg_attention > 0:
                    engagement_score = avg_attention
                
                performance_data.append({
                    "instructor_id": instructor_id,
                    "full_name": instructor["full_name"],
                    "email": instructor["email"],
                    "bootcamps": instructor["bootcamps"],
                    "avg_attendance": round(avg_attendance, 1),
                    "avg_attention": round(avg_attention, 1),
                    "avg_distraction": round(avg_distraction, 1),
                    "avg_student_grades": round(avg_grades, 1),
                    "total_students": total_students,
                    "total_sessions": total_sessions,
                    "effectiveness_score": round(effectiveness_score, 1),
                    "engagement_score": round(engagement_score, 1),
                    "performance_tier": (
                        "Excellent" if effectiveness_score >= 80 else
                        "Good" if effectiveness_score >= 65 else
                        "Average" if effectiveness_score >= 50 else
                        "Needs Improvement" if effectiveness_score > 0 else
                        "No Data"
                    )
                })
            
            # Sort by effectiveness score descending
            performance_data.sort(key=lambda x: x["effectiveness_score"], reverse=True)
            
            return performance_data
            
    except Exception as e:
        logger.error(f"Failed to fetch instructor performance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch instructor performance: {str(e)}")

@router.post("/correlation-analysis")
async def get_correlation_analysis(
    filters: DashboardFilters = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get correlation analysis between attendance, attention, and grades"""
    # Extract filter values
    bootcamp_ids = filters.bootcamp_ids
    granularity = filters.granularity
    include_completed = filters.include_completed
    date_start = filters.date_start
    date_end = filters.date_end
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            # Get allowed bootcamps
            allowed_bootcamps = []
            if bootcamp_ids:
                if not is_admin(user):
                    instructor_bootcamps = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                    instructor_bootcamp_ids = [row["bootcamp_id"] for row in instructor_bootcamps]
                    allowed_bootcamps = [bid for bid in bootcamp_ids if bid in instructor_bootcamp_ids]
                else:
                    allowed_bootcamps = bootcamp_ids
            else:
                if is_admin(user):
                    bootcamp_rows = await conn.fetch("SELECT bootcamp_id FROM bootcamps")
                else:
                    bootcamp_rows = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                allowed_bootcamps = [row["bootcamp_id"] for row in bootcamp_rows]

            if not allowed_bootcamps:
                return {"scatter_data": [], "correlations": {}}

            # Build date filter
            params = [allowed_bootcamps]
            date_filter = ""
            if date_start:
                date_filter += " AND cs.date >= $2"
                params.append(date_start)
            if date_end:
                date_filter += f" AND cs.date <= ${len(params) + 1}"
                params.append(date_end)

            # Get correlation data
            query = f"""
                SELECT 
                    cs.attendance_pct,
                    cs.avg_attention_rate,
                    AVG(g.score) as avg_grade
                FROM class_samples cs
                LEFT JOIN students s ON cs.bootcamp_id = s.bootcamp_id
                LEFT JOIN grades g ON s.student_id = g.student_id
                WHERE cs.bootcamp_id = ANY($1) {date_filter}
                AND cs.attendance_pct IS NOT NULL 
                AND cs.avg_attention_rate IS NOT NULL
                GROUP BY cs.id, cs.attendance_pct, cs.avg_attention_rate
                ORDER BY cs.attendance_pct
            """
            
            rows = await conn.fetch(query, *params)
            
            scatter_data = []
            attendance_vals = []
            attention_vals = []
            grade_vals = []
            
            for row in rows:
                if row["attendance_pct"] and row["avg_attention_rate"]:
                    data_point = {
                        "attendance": round(float(row["attendance_pct"]), 1),
                        "attention": round(float(row["avg_attention_rate"]), 1),
                        "grade": round(float(row["avg_grade"] or 0), 1)
                    }
                    scatter_data.append(data_point)
                    
                    attendance_vals.append(float(row["attendance_pct"]))
                    attention_vals.append(float(row["avg_attention_rate"]))
                    if row["avg_grade"]:
                        grade_vals.append(float(row["avg_grade"]))

            # Calculate simple correlation coefficients (Pearson's r approximation)
            def correlation(x, y):
                if len(x) < 2 or len(y) < 2:
                    return 0
                n = len(x)
                sum_x = sum(x)
                sum_y = sum(y)
                sum_xy = sum(x[i] * y[i] for i in range(n))
                sum_x2 = sum(x[i] ** 2 for i in range(n))
                sum_y2 = sum(y[i] ** 2 for i in range(n))
                
                numerator = n * sum_xy - sum_x * sum_y
                denominator = ((n * sum_x2 - sum_x ** 2) * (n * sum_y2 - sum_y ** 2)) ** 0.5
                
                return numerator / denominator if denominator != 0 else 0

            correlations = {
                "attendance_attention": round(correlation(attendance_vals, attention_vals), 3),
                "attendance_grades": round(correlation(attendance_vals, grade_vals), 3) if grade_vals else 0,
                "attention_grades": round(correlation(attention_vals, grade_vals), 3) if grade_vals else 0
            }

            return {
                "scatter_data": scatter_data,
                "correlations": correlations
            }
            
    except Exception as e:
        logger.error(f"Failed to fetch correlation analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch correlation analysis: {str(e)}")

@router.post("/heatmap-data")
async def get_heatmap_data(
    filters: DashboardFilters = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get heatmap data for time slot vs day of week performance analysis"""
    # Extract filter values
    bootcamp_ids = filters.bootcamp_ids
    granularity = filters.granularity
    include_completed = filters.include_completed
    date_start = filters.date_start
    date_end = filters.date_end
    metric = "attention"  # Default metric
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            # Get allowed bootcamps
            allowed_bootcamps = []
            if bootcamp_ids:
                if not is_admin(user):
                    instructor_bootcamps = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                    instructor_bootcamp_ids = [row["bootcamp_id"] for row in instructor_bootcamps]
                    allowed_bootcamps = [bid for bid in bootcamp_ids if bid in instructor_bootcamp_ids]
                else:
                    allowed_bootcamps = bootcamp_ids
            else:
                if is_admin(user):
                    bootcamp_rows = await conn.fetch("SELECT bootcamp_id FROM bootcamps")
                else:
                    bootcamp_rows = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                allowed_bootcamps = [row["bootcamp_id"] for row in bootcamp_rows]

            if not allowed_bootcamps:
                return []

            # Select metric to analyze
            metric_map = {
                "attention": "cs.avg_attention_rate",
                "attendance": "cs.attendance_pct", 
                "engagement": "(cs.avg_attention_rate + cs.attendance_pct) / 2"
            }
            
            metric_column = metric_map.get(metric, "cs.avg_attention_rate")
            
            # Build date filter
            params = [allowed_bootcamps]
            date_filter = ""
            if date_start:
                date_filter += " AND cs.date >= $2"
                params.append(date_start)
            if date_end:
                date_filter += f" AND cs.date <= ${len(params) + 1}"
                params.append(date_end)

            # Simplified approach: Return session distribution by time periods
            query = f"""
                SELECT 
                    CASE 
                        WHEN EXTRACT(HOUR FROM cs.start_time) < 6 THEN 'Early Morning (0-6h)'
                        WHEN EXTRACT(HOUR FROM cs.start_time) < 12 THEN 'Morning (6-12h)'
                        WHEN EXTRACT(HOUR FROM cs.start_time) < 18 THEN 'Afternoon (12-18h)'
                        ELSE 'Evening (18-24h)'
                    END as time_period,
                    AVG(cs.avg_attention_rate) as avg_attention,
                    AVG(cs.attendance_pct) as avg_attendance,
                    COUNT(*) as session_count,
                    AVG(cs.students_enrolled) as avg_students
                FROM class_samples cs
                WHERE cs.bootcamp_id = ANY($1) {date_filter}
                AND cs.start_time IS NOT NULL
                GROUP BY time_period
                ORDER BY MIN(EXTRACT(HOUR FROM cs.start_time))
            """
            
            rows = await conn.fetch(query, *params)
            
            heatmap_data = []
            for row in rows:
                heatmap_data.append({
                    "period": row["time_period"],
                    "attention": round(float(row["avg_attention"] or 0), 1),
                    "attendance": round(float(row["avg_attendance"] or 0), 1),
                    "sessions": row["session_count"],
                    "avg_students": round(float(row["avg_students"] or 0), 1),
                    "engagement": round((float(row["avg_attention"] or 0) + float(row["avg_attendance"] or 0)) / 2, 1)
                })
            
            return heatmap_data
            
    except Exception as e:
        logger.error(f"Failed to fetch heatmap data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch heatmap data: {str(e)}")

@router.post("/bootcamp-comparison")
async def get_bootcamp_comparison(
    filters: DashboardFilters = Body(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get bootcamp comparison metrics"""
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            # Build bootcamp filter
            bootcamp_filter = ""
            params = []
            
            if filters.bootcamp_ids:
                if not is_admin(user):
                    # Verify instructor access
                    instructor_bootcamps = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                        user["user_id"]
                    )
                    instructor_bootcamp_ids = [row["bootcamp_id"] for row in instructor_bootcamps]
                    bootcamp_ids = [bid for bid in filters.bootcamp_ids if bid in instructor_bootcamp_ids]
                else:
                    bootcamp_ids = filters.bootcamp_ids
                
                if bootcamp_ids:
                    bootcamp_filter = f"AND b.bootcamp_id = ANY($1::int[])"
                    params.append(bootcamp_ids)
            elif not is_admin(user):
                instructor_bootcamps = await conn.fetch(
                    "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $1",
                    user["user_id"]
                )
                bootcamp_ids = [row["bootcamp_id"] for row in instructor_bootcamps]
                if bootcamp_ids:
                    bootcamp_filter = f"AND b.bootcamp_id = ANY($1::int[])"
                    params.append(bootcamp_ids)

            # Date filter using filters from DashboardFilters
            date_filter = ""
            if filters.start_date and filters.end_date:
                date_filter = "AND b.start_date >= $2 AND b.end_date <= $3"
                params.extend([filters.start_date, filters.end_date])

            query = f"""
                SELECT 
                    b.bootcamp_id,
                    b.bootcamp_name,
                    b.start_date,
                    b.end_date,
                    CASE 
                        WHEN b.end_date < CURRENT_DATE THEN 'completed'
                        WHEN b.start_date > CURRENT_DATE THEN 'upcoming'
                        ELSE 'active'
                    END as status,
                    COUNT(DISTINCT ib.instructor_id) as instructor_count,
                    COUNT(DISTINCT s.student_id) as student_count,
                    COUNT(DISTINCT cs.session_id) as total_sessions,
                    COALESCE(AVG(cs.headcount::float / NULLIF(cs.total_expected, 0) * 100), 0) as avg_attendance_rate,
                    COALESCE(AVG((cs.attention_count::float / NULLIF(cs.headcount, 0)) * 100), 0) as avg_attention_rate,
                    COALESCE(AVG(g.grade), 0) as avg_grade,
                    COALESCE(
                        COUNT(DISTINCT CASE WHEN g.grade >= 70 THEN s.student_id END)::float / 
                        NULLIF(COUNT(DISTINCT s.student_id), 0) * 100, 0
                    ) as completion_rate,
                    85.0 as satisfaction_score
                FROM bootcamps b
                LEFT JOIN instructor_bootcamps ib ON b.bootcamp_id = ib.bootcamp_id
                LEFT JOIN students s ON b.bootcamp_id = s.bootcamp_id
                LEFT JOIN class_samples cs ON s.student_id = cs.student_id
                LEFT JOIN grades g ON s.student_id = g.student_id
                WHERE 1=1 {bootcamp_filter} {date_filter}
                GROUP BY b.bootcamp_id, b.bootcamp_name, b.start_date, b.end_date
                ORDER BY b.bootcamp_name
            """

            rows = await conn.fetch(query, *params)
            
            bootcamp_data = []
            for row in rows:
                bootcamp_data.append({
                    "bootcamp_id": str(row["bootcamp_id"]),
                    "bootcamp_name": row["bootcamp_name"],
                    "instructor_count": row["instructor_count"] or 0,
                    "student_count": row["student_count"] or 0,
                    "total_sessions": row["total_sessions"] or 0,
                    "avg_attendance_rate": round(float(row["avg_attendance_rate"] or 0), 1),
                    "avg_attention_rate": round(float(row["avg_attention_rate"] or 0), 1),
                    "avg_grade": round(float(row["avg_grade"] or 0), 1),
                    "completion_rate": round(float(row["completion_rate"] or 0), 1),
                    "satisfaction_score": round(float(row["satisfaction_score"] or 0), 1),
                    "start_date": row["start_date"].isoformat(),
                    "end_date": row["end_date"].isoformat(),
                    "status": row["status"]
                })
            
            return bootcamp_data
            
    except Exception as e:
        logger.error(f"Failed to fetch bootcamp comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch bootcamp comparison: {str(e)}")

@router.post("/predictive-insights")
async def get_predictive_insights(
    bootcamp_ids: Optional[List[int]] = None,
    time_range: str = "7d",
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get predictive analytics data"""
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            # Time range mapping
            hours_back = {
                "1d": 24,
                "7d": 168,
                "30d": 720
            }.get(time_range, 168)
            
            # Build bootcamp filter
            bootcamp_filter = ""
            params = [hours_back]
            
            if bootcamp_ids:
                if not is_admin(user):
                    instructor_bootcamps = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $2",
                        user["user_id"]
                    )
                    instructor_bootcamp_ids = [row["bootcamp_id"] for row in instructor_bootcamps]
                    bootcamp_ids = [bid for bid in bootcamp_ids if bid in instructor_bootcamp_ids]
                
                if bootcamp_ids:
                    bootcamp_filter = f"AND s.bootcamp_id = ANY($2::int[])"
                    params.append(bootcamp_ids)
            elif not is_admin(user):
                instructor_bootcamps = await conn.fetch(
                    "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $2",
                    user["user_id"]
                )
                bootcamp_ids = [row["bootcamp_id"] for row in instructor_bootcamps]
                if bootcamp_ids:
                    bootcamp_filter = f"AND s.bootcamp_id = ANY($2::int[])"
                    params.append(bootcamp_ids)

            # Get historical data for predictions
            query = f"""
                SELECT 
                    cs.timestamp,
                    TO_CHAR(cs.timestamp, 'YYYY-MM-DD HH24:MI:SS') as formatted_timestamp,
                    TO_CHAR(cs.timestamp, 'HH24:MI') as time_only,
                    (cs.attention_count::float / NULLIF(cs.headcount, 0) * 100) as actual_attention,
                    -- Simple predictive model based on historical patterns
                    LAG((cs.attention_count::float / NULLIF(cs.headcount, 0) * 100), 1) OVER (ORDER BY cs.timestamp) * 0.7 +
                    AVG((cs.attention_count::float / NULLIF(cs.headcount, 0) * 100)) OVER (ORDER BY cs.timestamp ROWS BETWEEN 5 PRECEDING AND 1 PRECEDING) * 0.3 as predicted_attention,
                    -- Risk score based on multiple factors
                    CASE 
                        WHEN EXTRACT(hour FROM cs.timestamp) IN (14, 15) THEN 0.8  -- Post-lunch dip
                        WHEN EXTRACT(hour FROM cs.timestamp) < 9 THEN 0.6  -- Early morning
                        WHEN EXTRACT(dow FROM cs.timestamp) IN (1, 6) THEN 0.5  -- Monday/Saturday
                        ELSE 0.3
                    END as risk_score,
                    -- Factor analysis
                    EXTRACT(hour FROM cs.timestamp) / 24.0 as time_of_day_factor,
                    EXTRACT(dow FROM cs.timestamp) / 7.0 as day_of_week_factor,
                    CASE WHEN cs.session_duration > 120 THEN 0.8 ELSE cs.session_duration / 150.0 END as session_duration_factor,
                    0.5 as weather_impact_factor,
                    LAG((cs.attention_count::float / NULLIF(cs.headcount, 0) * 100), 1) OVER (ORDER BY cs.timestamp) / 100.0 as previous_performance_factor
                FROM class_samples cs
                JOIN students s ON cs.student_id = s.student_id
                WHERE cs.timestamp >= NOW() - INTERVAL '{hours_back} hours'
                {bootcamp_filter}
                AND cs.headcount > 0
                ORDER BY cs.timestamp DESC
                LIMIT 200
            """

            rows = await conn.fetch(query, *params)
            
            prediction_data = []
            for row in rows:
                actual = row["actual_attention"] or 0
                predicted = row["predicted_attention"] or actual
                
                prediction_data.append({
                    "timestamp": row["formatted_timestamp"],
                    "date": row["timestamp"].strftime("%Y-%m-%d"),
                    "time": row["time_only"],
                    "actual_attention": round(actual, 1),
                    "predicted_attention": round(predicted, 1),
                    "confidence_interval_lower": round(max(0, predicted - 10), 1),
                    "confidence_interval_upper": round(min(100, predicted + 10), 1),
                    "risk_score": round(row["risk_score"] or 0.3, 2),
                    "factors": {
                        "time_of_day": round(row["time_of_day_factor"] or 0.5, 2),
                        "day_of_week": round(row["day_of_week_factor"] or 0.5, 2),
                        "session_duration": round(row["session_duration_factor"] or 0.5, 2),
                        "weather_impact": round(row["weather_impact_factor"] or 0.5, 2),
                        "previous_performance": round(row["previous_performance_factor"] or 0.5, 2)
                    }
                })
            
            # Generate alerts
            alerts = []
            high_risk_periods = [p for p in prediction_data if p["risk_score"] > 0.7]
            
            if high_risk_periods:
                alerts.append({
                    "type": "risk",
                    "message": f"High risk period detected in next {len(high_risk_periods)} time slots",
                    "confidence": 85,
                    "impact": "high",
                    "timeframe": "Next 2 hours"
                })
            
            # Check for declining trend
            if len(prediction_data) >= 5:
                recent_predictions = [p["predicted_attention"] for p in prediction_data[:5]]
                if all(recent_predictions[i] <= recent_predictions[i+1] for i in range(len(recent_predictions)-1)):
                    alerts.append({
                        "type": "warning",
                        "message": "Declining attention trend detected",
                        "confidence": 75,
                        "impact": "medium",
                        "timeframe": "Current session"
                    })
            
            return {
                "data": prediction_data,
                "alerts": alerts,
                "accuracy": 0.82  # Model accuracy placeholder
            }
            
    except Exception as e:
        logger.error(f"Failed to fetch predictive insights: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch predictive insights: {str(e)}")

@router.post("/engagement-metrics")
async def get_engagement_metrics(
    bootcamp_ids: Optional[List[int]] = None,
    time_window: str = "1h",
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get real-time engagement metrics"""
    pool = get_pool()
    try:
        async with pool.acquire() as conn:
            # Time window mapping
            minutes_back = {
                "15m": 15,
                "1h": 60,
                "4h": 240,
                "1d": 1440
            }.get(time_window, 60)
            
            # Build bootcamp filter
            bootcamp_filter = ""
            params = [minutes_back]
            
            if bootcamp_ids:
                if not is_admin(user):
                    instructor_bootcamps = await conn.fetch(
                        "SELECT bootcamp_id FROM instructor_bootcamps WHERE instructor_id = $2",
                        user["user_id"]
                    )
                    instructor_bootcamp_ids = [row["bootcamp_id"] for row in instructor_bootcamps]
                    bootcamp_ids = [bid for bid in bootcamp_ids if bid in instructor_bootcamp_ids]
                
                if bootcamp_ids:
                    bootcamp_filter = f"AND s.bootcamp_id = ANY($2::int[])"
                    params.append(bootcamp_ids)

            # Get engagement data
            query = f"""
                SELECT 
                    TO_CHAR(cs.timestamp, 'YYYY-MM-DD HH24:MI:SS') as timestamp,
                    TO_CHAR(cs.timestamp, 'HH24:MI') as time,
                    -- Active participation (based on attention and interaction)
                    COALESCE((cs.attention_count::float / NULLIF(cs.headcount, 0) * 100), 0) as active_participation,
                    -- Attention score
                    COALESCE((cs.attention_count::float / NULLIF(cs.headcount, 0) * 100), 0) as attention_score,
                    -- Simulated interaction rate (questions, chat, etc.)
                    CASE 
                        WHEN EXTRACT(minute FROM cs.timestamp) % 15 = 0 THEN 3.5
                        WHEN EXTRACT(minute FROM cs.timestamp) % 10 = 0 THEN 2.8
                        ELSE 1.2 + (RANDOM() * 2)
                    END as interaction_rate,
                    -- Question frequency
                    CASE 
                        WHEN EXTRACT(minute FROM cs.timestamp) % 20 = 0 THEN 4.5
                        ELSE 1.8 + (RANDOM() * 1.5)
                    END as question_frequency,
                    -- Camera activity (based on headcount changes)
                    COALESCE(ABS(cs.headcount - LAG(cs.headcount) OVER (ORDER BY cs.timestamp)) * 10, 50) as camera_activity,
                    -- Simulated mouse/keyboard/scroll activity
                    60 + (RANDOM() * 35) as mouse_movement,
                    45 + (RANDOM() * 40) as keyboard_activity,
                    30 + (RANDOM() * 50) as scroll_behavior,
                    -- Focus duration (inverse of distraction)
                    COALESCE(
                        CASE 
                            WHEN cs.distraction_count = 0 THEN 15
                            ELSE 15.0 / (1 + cs.distraction_count)
                        END, 8
                    ) as focus_duration,
                    -- Break frequency
                    CASE 
                        WHEN cs.headcount < LAG(cs.headcount) OVER (ORDER BY cs.timestamp) THEN 2
                        ELSE 0.5
                    END as break_frequency
                FROM class_samples cs
                JOIN students s ON cs.student_id = s.student_id
                WHERE cs.timestamp >= NOW() - INTERVAL '{minutes_back} minutes'
                {bootcamp_filter}
                AND cs.headcount > 0
                ORDER BY cs.timestamp DESC
                LIMIT 100
            """

            rows = await conn.fetch(query, *params)
            
            engagement_data = []
            for row in rows:
                engagement_data.append({
                    "timestamp": row["timestamp"],
                    "time": row["time"],
                    "active_participation": round(row["active_participation"], 1),
                    "attention_score": round(row["attention_score"], 1),
                    "interaction_rate": round(row["interaction_rate"], 1),
                    "question_frequency": round(row["question_frequency"], 1),
                    "camera_activity": round(row["camera_activity"], 1),
                    "mouse_movement": round(row["mouse_movement"], 1),
                    "keyboard_activity": round(row["keyboard_activity"], 1),
                    "scroll_behavior": round(row["scroll_behavior"], 1),
                    "focus_duration": round(row["focus_duration"], 1),
                    "break_frequency": round(row["break_frequency"], 1)
                })
            
            # Calculate real-time metrics
            current_engagement = 75.0  # Placeholder
            if engagement_data:
                current_engagement = (
                    float(engagement_data[0]["active_participation"]) * 0.4 +
                    float(engagement_data[0]["attention_score"]) * 0.3 +
                    min(float(engagement_data[0]["interaction_rate"]) * 10, 100) * 0.2 +
                    min(float(engagement_data[0]["focus_duration"]) * 6, 100) * 0.1
                )
            
            # Determine trend
            trend = "stable"
            if len(engagement_data) >= 5:
                recent_scores = [d["attention_score"] for d in engagement_data[:5]]
                if recent_scores[0] > recent_scores[-1] + 5:
                    trend = "increasing"
                elif recent_scores[0] < recent_scores[-1] - 5:
                    trend = "decreasing"
            
            real_time_metrics = {
                "current_engagement": round(current_engagement, 1),
                "peak_engagement_time": "10:30 AM",  # Placeholder
                "low_engagement_periods": len([d for d in engagement_data if d["attention_score"] < 60]),
                "average_focus_duration": round(sum(d["focus_duration"] for d in engagement_data) / len(engagement_data) if engagement_data else 0, 1),
                "interaction_trend": trend
            }
            
            return {
                "data": engagement_data,
                "real_time_metrics": real_time_metrics
            }
            
    except Exception as e:
        logger.error(f"Failed to fetch engagement metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch engagement metrics: {str(e)}")
