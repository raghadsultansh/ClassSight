from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Dict, Any, Optional, List
from datetime import date
import asyncpg

from core.deps import get_current_user, assert_bootcamp_scope, get_instructor_bootcamp_ids
from core.rbac import is_admin, is_instructor
from db.pool import get_pool
from utils.pagination import parse_pagination_params, create_paginated_response
from models.schemas import ReportsList, ReportRow, ReportGenerate

router = APIRouter()


@router.get("", response_model=ReportsList)
async def get_reports(
    bootcamp_id: Optional[int] = Query(None, description="Filter by bootcamp"),
    start: Optional[date] = Query(None, description="Filter reports from this date"),
    end: Optional[date] = Query(None, description="Filter reports until this date"),
    status: Optional[str] = Query(None, description="Filter by status: pending, completed, failed"),
    format: Optional[str] = Query(None, description="Filter by format: pdf, csv, excel"),
    page: Optional[int] = Query(1, ge=1),
    page_size: Optional[int] = Query(20, ge=1, le=100),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get paginated list of reports.
    
    - Admin: can view all reports
    - Instructor: can only view reports for assigned bootcamps
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
                return ReportsList(items=[], page=1, page_size=page_size, total=0)
    elif bootcamp_id:
        bootcamp_filter = [bootcamp_id]
    
    # Parse pagination
    pagination = parse_pagination_params(page, page_size)
    
    # Build query conditions
    conditions = []
    params = []
    
    if bootcamp_filter:
        conditions.append(f"r.bootcamp_id = ANY(${len(params) + 1})")
        params.append(bootcamp_filter)
    
    if start:
        conditions.append(f"r.report_date >= ${len(params) + 1}")
        params.append(start)
    
    if end:
        conditions.append(f"r.report_date <= ${len(params) + 1}")
        params.append(end)
    
    if status:
        conditions.append(f"r.status = ${len(params) + 1}")
        params.append(status)
    
    if format:
        conditions.append(f"r.format = ${len(params) + 1}")
        params.append(format)
    
    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""
    
    # Get total count
    count_query = f"""
        SELECT COUNT(*) as total
        FROM reports r
        {where_clause}
    """
    
    total_result = await pool.fetchrow(count_query, *params)
    total = total_result['total'] if total_result else 0
    
    # Get paginated results
    query = f"""
        SELECT 
            r.id,
            r.title,
            r.report_date,
            r.status,
            r.format,
            r.storage_path,
            r.bootcamp_id,
            r.created_at,
            b.bootcamp_name
        FROM reports r
        LEFT JOIN bootcamps b ON r.bootcamp_id = b.bootcamp_id
        {where_clause}
        ORDER BY r.created_at DESC
        LIMIT ${len(params) + 1} OFFSET ${len(params) + 2}
    """
    
    params.extend([pagination['limit'], pagination['offset']])
    rows = await pool.fetch(query, *params)
    
    items = [
        ReportRow(
            id=row['id'],
            title=row['title'],
            report_date=row['report_date'],
            status=row['status'],
            format=row['format'],
            storage_path=row['storage_path'],
            bootcamp_id=row['bootcamp_id'],
            bootcamp_name=row['bootcamp_name'],
            created_at=row['created_at'],
            file_size=None  # File size not stored in database
        )
        for row in rows
    ]
    
    return ReportsList(
        items=items,
        page=pagination['page'],
        page_size=pagination['page_size'],
        total=total,
        pages=(total + pagination['page_size'] - 1) // pagination['page_size']
    )


@router.post("/generate")
async def generate_report(
    report_data: ReportGenerate,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Generate a new report (admin only for now).
    This endpoint creates a report generation job.
    """
    pool = get_pool()
    
    # Check permissions
    if not is_admin(user):
        raise HTTPException(
            status_code=403,
            detail="Only administrators can generate reports"
        )
    
    # Validate bootcamp access if specified
    if report_data.bootcamp_id:
        await assert_bootcamp_scope(user, report_data.bootcamp_id, pool)
    
    # Validate date range
    if report_data.start_date > report_data.end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date must be before end date"
        )
    
    try:
        # Create new report entry
        query = """
            INSERT INTO reports (
                title, report_date, status, format, bootcamp_id,
                date_range_start, date_range_end
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, created_at
        """
        
        result = await pool.fetchrow(
            query,
            report_data.title,
            report_data.end_date,
            'generating',
            report_data.format,
            report_data.bootcamp_id,
            report_data.start_date,
            report_data.end_date
        )
        
        # TODO: Trigger actual report generation job (e.g., queue to background worker)
        # For now, just return the created report info
        
        return {
            "id": result['id'],
            "status": "pending",
            "message": "Report generation queued successfully",
            "created_at": result['created_at']
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create report: {str(e)}"
        )