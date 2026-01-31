"""
Utility functions for exporting data to CSV files
"""

import os
import pandas as pd
from models import (
    Department, Section, Faculty, Course, Classroom,
    Timetable, RoomOccupancy, User
)


def export_csvs():
    """Export all data to CSV files"""
    try:
        os.makedirs("data", exist_ok=True)
        
        # Departments
        departments = Department.query.all()
        if departments:
            dept_df = pd.DataFrame([
                {
                    "id": d.id,
                    "dept_name": d.dept_name,
                    "sections": ", ".join([getattr(s, "name", str(s.id)) for s in d.sections]),
                    "faculty": ", ".join([getattr(f, "faculty_name", str(f.faculty_id)) for f in d.faculty])
                }
                for d in departments
            ])
            dept_df.to_csv("data/departments.csv", index=False)
        
        # Sections
        sections = Section.query.all()
        if sections:
            sections_df = pd.DataFrame([{
                "name": s.name, "year": s.year, "dept_name": s.department.dept_name if s.department else "",
                "student_count": len(s.users), "max_hours_per_day": s.max_hours_per_day
            } for s in sections])
            sections_df.to_csv("data/sections.csv", index=False)
        
        # Faculty
        faculty = Faculty.query.all()
        if faculty:
            faculty_df = pd.DataFrame([{
                "faculty_name": f.faculty_name, "max_hours": f.max_hours,
                "dept_name": f.department.dept_name if f.department else "",
                "email": f.email or "",
                "faculty_id": f.faculty_id
            } for f in faculty])
            faculty_df.to_csv("data/faculty.csv", index=False)
        
        # Courses
        courses = Course.query.all()
        if courses:
            courses_df = pd.DataFrame([{
                "name": c.name, "type": c.type, "credits": c.credits,
                "year": c.year, "semester": c.semester,
                "dept_name": c.department.dept_name, "dept_id": c.dept_id,
                "faculty_name": Faculty.query.get(c.faculty_id).faculty_name if Faculty.query.get(c.faculty_id) else "Unknown"
            } for c in courses])
            courses_df.to_csv("data/courses.csv", index=False)
        
        # Rooms
        rooms = Classroom.query.all()
        if rooms:
            rooms_df = pd.DataFrame([{
                "room_id": r.room_id, "name": r.name, "capacity": r.capacity, "resources": r.resources,
                "current_status": "free"
            } for r in rooms])
            rooms_df.to_csv("data/classrooms.csv", index=False)
        
        # Timetable
        timetable = Timetable.query.all()
        if timetable:
            timetable_df = pd.DataFrame([{
                "course": t.course.name, "section": t.section.name, "year": t.section.year,
                "faculty": t.faculty.faculty_name, "room": t.room.name,
                "day": t.day, "start_time": t.start_time, "department": t.course.department.dept_name,
            } for t in timetable])
            timetable_df.to_csv("data/timetable.csv", index=False)
        
        # Room occupancy log
        occupancies = RoomOccupancy.query.order_by(RoomOccupancy.timestamp.desc()).limit(1000).all()
        if occupancies:
            occupancy_df = pd.DataFrame([{
                "room_name": o.room.name, "status": o.status,
                "updated_by": o.user.full_name if o.user else "Unknown",
                "timestamp": o.timestamp.isoformat() if o.timestamp else "", "notes": o.notes or ""
            } for o in occupancies])
            occupancy_df.to_csv("data/room_occupancy_log.csv", index=False)
        
        # Students
        students = User.query.filter_by(role='student').all()
        if students:
            students_df = pd.DataFrame([{
                "username": s.username,
                "dept_name": s.department.dept_name if s.department else "",
                "year": s.year,
                "section_name": s.section.name if s.section else ""
            } for s in students])
            students_df.to_csv("data/students.csv", index=False)
        
        return True
    except Exception as e:
        print(f"CSV export error: {e}")
        return False
