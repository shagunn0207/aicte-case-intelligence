"""
Shared Case Deadline Service for AICTE Case Intelligence.
Problem Statement: SIH26264

Enforces single source of truth for:
- Overdue case classification: due_date < current_time AND status != 'Disposed'
- Approaching-deadline warning window (default: 48 hours for demonstration)
- Timezone-safe UTC timestamp normalization and duration calculations.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional


def normalize_datetime(dt: Optional[datetime]) -> Optional[datetime]:
    """
    Normalizes a datetime object into a naive UTC datetime for consistent
    comparison with SQLite database timestamps.
    """
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def get_current_utc_time() -> datetime:
    """Returns current UTC timestamp without timezone offset."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def is_case_overdue(
    due_date: Optional[datetime],
    status: Optional[str],
    current_time: Optional[datetime] = None
) -> bool:
    """
    Determines if a complaint case is overdue.
    Rule: A case is overdue if due_date < current_time AND status != 'Disposed'.
    Missing due dates or disposed cases are never overdue.
    """
    if due_date is None:
        return False

    status_str = (status or "").strip()
    if status_str.lower() == "disposed":
        return False

    now = normalize_datetime(current_time) or get_current_utc_time()
    norm_due = normalize_datetime(due_date)

    return norm_due < now


def is_case_approaching_deadline(
    due_date: Optional[datetime],
    status: Optional[str],
    window_hours: int = 48,
    current_time: Optional[datetime] = None
) -> bool:
    """
    Determines if a case is approaching its statutory deadline within the warning window.
    Default demonstration window: 48 hours.
    Disposed or already overdue cases return False.
    """
    if due_date is None:
        return False

    status_str = (status or "").strip()
    if status_str.lower() == "disposed":
        return False

    now = normalize_datetime(current_time) or get_current_utc_time()
    norm_due = normalize_datetime(due_date)

    # If already passed deadline, it is overdue, not approaching
    if norm_due <= now:
        return False

    window_end = now + timedelta(hours=window_hours)
    return now < norm_due <= window_end


def get_time_remaining(
    due_date: Optional[datetime],
    current_time: Optional[datetime] = None
) -> Optional[timedelta]:
    """
    Calculates time remaining until case deadline.
    Returns positive timedelta if in future, negative timedelta if in past, or None if no due_date.
    """
    if due_date is None:
        return None

    now = normalize_datetime(current_time) or get_current_utc_time()
    norm_due = normalize_datetime(due_date)

    return norm_due - now


def get_days_overdue(
    due_date: Optional[datetime],
    status: Optional[str],
    current_time: Optional[datetime] = None
) -> int:
    """
    Returns the integer number of full days a non-disposed case is past its deadline.
    Returns 0 if the case is not overdue or has already been disposed.
    """
    if not is_case_overdue(due_date, status, current_time=current_time):
        return 0

    now = normalize_datetime(current_time) or get_current_utc_time()
    norm_due = normalize_datetime(due_date)

    delta = now - norm_due
    # Return at least 1 day overdue if overdue
    days = delta.days
    return max(1, days)
