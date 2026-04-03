"""
Utility functions for timetable operations
"""

from models import Timetable


def check_for_conflict(timetable_entry_to_move, new_day, new_start_time, exclude_ids=None):
    """
    Checks if moving a timetable entry to a new day/start_time would cause a conflict.
    Returns (error_message, conflicting_entry) if a conflict exists, otherwise (None, None).
    
    exclude_ids: an optional list of timetable_ids to additionally exclude from conflict checks.
                 Used during true swaps where both entries are moving simultaneously.
    """
    # Build a set of IDs to exclude (always exclude the entry being moved)
    excluded = {timetable_entry_to_move.timetable_id}
    if exclude_ids:
        excluded.update(exclude_ids)

    # 1. Check for Faculty Conflict
    faculty_conflict = Timetable.query.filter(
        Timetable.faculty_id == timetable_entry_to_move.faculty_id,
        Timetable.day == new_day,
        Timetable.start_time == new_start_time,
        ~Timetable.timetable_id.in_(excluded)
    ).first()
    if faculty_conflict:
        return f"Faculty is already assigned to '{faculty_conflict.course.name}' at that time.", faculty_conflict

    # 2. Check for Section Conflict
    section_conflict = Timetable.query.filter(
        Timetable.section_id == timetable_entry_to_move.section_id,
        Timetable.day == new_day,
        Timetable.start_time == new_start_time,
        ~Timetable.timetable_id.in_(excluded)
    ).first()
    if section_conflict:
        return f"Section is already scheduled for '{section_conflict.course.name}' at that time.", section_conflict

    # 3. Check for Room Conflict
    room_conflict = Timetable.query.filter(
        Timetable.room_id == timetable_entry_to_move.room_id,
        Timetable.day == new_day,
        Timetable.start_time == new_start_time,
        ~Timetable.timetable_id.in_(excluded)
    ).first()
    if room_conflict:
        return f"Room '{timetable_entry_to_move.room.name}' is already booked at that time.", room_conflict

    return None, None
