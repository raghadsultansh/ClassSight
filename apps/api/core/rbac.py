from typing import Dict, Any


def is_admin(user: Dict[str, Any]) -> bool:
    """Check if user has admin role."""
    return user.get("role") == "admin"


def is_instructor(user: Dict[str, Any]) -> bool:
    """Check if user has instructor role."""
    return user.get("role") == "instructor"


def can_access_all_bootcamps(user: Dict[str, Any]) -> bool:
    """Check if user can access all bootcamps (admin only)."""
    return is_admin(user)