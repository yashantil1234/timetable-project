"""
Utility functions for timetable operations
"""

from models import Timetable


def check_for_conflict(timetable_entry_to_move, new_day, new_start_time):
    """
    Checks if moving a timetable entry to a new day/start_time would cause a conflict.
    Returns an error message string if a conflict exists, otherwise returns None.
    """
    # 1. Check for Faculty Conflict: Is the teacher already busy at the new time?
    faculty_conflict = Timetable.query.filter(
        Timetable.faculty_id == timetable_entry_to_move.faculty_id,
        Timetable.day == new_day,
        Timetable.start_time == new_start_time,
        Timetable.timetable_id != timetable_entry_to_move.timetable_id  # Exclude the entry we are moving
    ).first()
    if faculty_conflict:
        return f"Faculty is already assigned to '{faculty_conflict.course.name}' at that time."

    # 2. Check for Section Conflict: Is the section already in a class at the new time?
    section_conflict = Timetable.query.filter(
        Timetable.section_id == timetable_entry_to_move.section_id,
        Timetable.day == new_day,
        Timetable.start_time == new_start_time,
        Timetable.timetable_id != timetable_entry_to_move.timetable_id
    ).first()
    if section_conflict:
        return f"Section is already scheduled for '{section_conflict.course.name}' at that time."

    # 3. Check for Room Conflict: Is the room already booked at the new time?
    room_conflict = Timetable.query.filter(
        Timetable.room_id == timetable_entry_to_move.room_id,
        Timetable.day == new_day,
        Timetable.start_time == new_start_time,
        Timetable.timetable_id != timetable_entry_to_move.timetable_id
    ).first()
    if room_conflict:
        return f"Room '{timetable_entry_to_move.room.name}' is already booked at that time."

    return None  # No conflicts found
