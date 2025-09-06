from typing import Dict, Any, List, Optional
from math import ceil


def parse_pagination_params(page: Optional[int] = None, page_size: Optional[int] = None) -> Dict[str, int]:
    """
    Parse and validate pagination parameters.
    
    Args:
        page: Page number (1-based, defaults to 1)
        page_size: Items per page (defaults to 20, max 100)
        
    Returns:
        Dict with page, page_size, offset, limit
    """
    page = max(1, page or 1)
    page_size = min(100, max(1, page_size or 20))
    offset = (page - 1) * page_size
    limit = page_size
    
    return {
        'page': page,
        'page_size': page_size,
        'offset': offset,
        'limit': limit
    }


def create_paginated_response(
    items: List[Any],
    page: int,
    page_size: int,
    total: Optional[int] = None
) -> Dict[str, Any]:
    """
    Create a standardized paginated response.
    
    Args:
        items: List of items for current page
        page: Current page number
        page_size: Items per page
        total: Total count (optional)
        
    Returns:
        Paginated response dict
    """
    response = {
        'items': items,
        'page': page,
        'page_size': page_size
    }
    
    if total is not None:
        response['total'] = total
        response['pages'] = ceil(total / page_size) if page_size > 0 else 0
        response['has_next'] = page < response['pages']
        response['has_prev'] = page > 1
    
    return response