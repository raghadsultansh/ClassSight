from fastapi import APIRouter, Depends
from typing import Dict, Any
from core.deps import get_current_user
from models.schemas import UserCtx

router = APIRouter()


@router.get("/me", response_model=UserCtx)
async def get_current_user_info(user: Dict[str, Any] = Depends(get_current_user)):
    """
    Debug endpoint to verify user authentication headers.
    Returns the current user's ID and role.
    """
    return UserCtx(
        user_id=user["user_id"],
        role=user["role"]
    )