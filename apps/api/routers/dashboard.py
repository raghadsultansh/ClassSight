from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Dict, Any, Optional, List
from datetime import date, datetime
import asyncpg
from statistics import mean

from core.deps import get_current_user, assert_bootcamp_scope, get_instructor_bootcamp_ids
from core.rbac import is_admin, is_instructor
from db.pool import get_pool
from utils.dates import resolve_date_range, granularity_to_sql_bucket
from models.schemas import DashboardResponse, Kpi, SeriesPoint, LeaderboardEntry

router = APIRouter()


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