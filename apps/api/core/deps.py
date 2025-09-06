from fastapi import HTTPException, Header, Depends
from typing import Dict, Any, Optional
import asyncpg
from uuid import UUID

from db.pool import get_pool
from core.rbac import is_admin, is_instructor


async def get_current_user(
    x_user_id: Optional[str] = Header(None, alias="x-user-id"),
    x_user_role: Optional[str] = Header(None, alias="x-user-role")
) -> Dict[str, Any]:
    """Get user from request headers"""
    if not x_user_id or not x_user_role:
        raise HTTPException(
            status_code=401,
            detail="Missing authentication headers. Please log in."
        )
    
    try:
        user_id = UUID(x_user_id)
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid user ID format"
        )
    
    if x_user_role not in ["admin", "instructor"]:
        raise HTTPException(
            status_code=401,
            detail="Invalid user role"
        )
    
    return {
        "user_id": user_id,
        "role": x_user_role
    }


async def require_admin(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Only admins can access this"""
    if not is_admin(user):
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return user


async def assert_bootcamp_scope(
    user: Dict[str, Any],
    bootcamp_id: Optional[int],
    pool: asyncpg.Pool
) -> None:
    """Check if user can access this bootcamp"""
    # Admin can access everything
    if is_admin(user):
        return
    
    # If no bootcamp specified, let it pass (will be filtered later)
    if bootcamp_id is None:
        return
    
    # Check if instructor is assigned to this bootcamp
    if is_instructor(user):
        query = """
            SELECT 1 FROM instructor_bootcamps 
            WHERE instructor_id = $1 AND bootcamp_id = $2
        """
        result = await pool.fetchrow(query, user["user_id"], bootcamp_id)
        
        if not result:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied to bootcamp {bootcamp_id}"
            )
        return
    
    # Unknown role
    raise HTTPException(
        status_code=403,
        detail="Insufficient permissions"
    )


async def get_instructor_bootcamp_ids(user_id: UUID, pool: asyncpg.Pool) -> list[int]:
    """Get bootcamps this instructor can access"""
    query = """
        SELECT bootcamp_id FROM instructor_bootcamps 
        WHERE instructor_id = $1
    """
    rows = await pool.fetch(query, user_id)
    return [row['bootcamp_id'] for row in rows]