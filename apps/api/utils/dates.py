from datetime import date, datetime, timedelta
from typing import Tuple, Optional


def get_saudi_week_range(target_date: Optional[date] = None) -> Tuple[date, date]:
    """
    Get the Saudi week range (Friday to Thursday) for a given date.
    If no date provided, uses current date.
    
    Returns:
        Tuple of (week_start_friday, week_end_thursday)
    """
    if target_date is None:
        target_date = date.today()
    
    # Find the most recent Friday (week start)
    days_since_friday = (target_date.weekday() + 3) % 7  # Friday = 4, so adjust
    week_start = target_date - timedelta(days=days_since_friday)
    
    # Thursday is 6 days after Friday
    week_end = week_start + timedelta(days=6)
    
    return week_start, week_end


def resolve_date_range(start: Optional[date] = None, end: Optional[date] = None) -> Tuple[date, date]:
    """
    Resolve date range with defaults to current Saudi week if not provided.
    
    Args:
        start: Start date (optional)
        end: End date (optional)
        
    Returns:
        Tuple of (start_date, end_date)
    """
    if start is None or end is None:
        default_start, default_end = get_saudi_week_range()
        start = start or default_start
        end = end or default_end
    
    return start, end


def granularity_to_sql_bucket(granularity: str) -> str:
    """
    Convert granularity string to SQL date_trunc format.
    
    Args:
        granularity: '30m', 'hour', 'day', 'week'
        
    Returns:
        SQL date_trunc format string
    """
    mapping = {
        '30m': 'hour',  # We'll handle 30-minute grouping in application logic
        'hour': 'hour',
        'day': 'day',
        'week': 'week'
    }
    return mapping.get(granularity, 'day')


def get_time_buckets(start: datetime, end: datetime, granularity: str) -> list:
    """
    Generate time buckets for a given range and granularity.
    
    Args:
        start: Start datetime
        end: End datetime  
        granularity: '30m', 'hour', 'day', 'week'
        
    Returns:
        List of datetime buckets
    """
    buckets = []
    current = start
    
    if granularity == '30m':
        delta = timedelta(minutes=30)
    elif granularity == 'hour':
        delta = timedelta(hours=1)
    elif granularity == 'day':
        delta = timedelta(days=1)
    elif granularity == 'week':
        delta = timedelta(weeks=1)
    else:
        delta = timedelta(days=1)  # default
    
    while current <= end:
        buckets.append(current)
        current += delta
    
    return buckets