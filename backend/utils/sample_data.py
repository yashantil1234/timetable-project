"""
Utility functions for creating sample data
"""

from extensions import db
from models import (
    Department, Section, Classroom, CourseAllocation,
    Faculty, User
)


def create_sample_data():
    """Create sample data if database is empty"""
    if Department.query.count() == 0:
        # Add sample departments
        sample_depts = [
            "Computer Science", "Mathematics", "Physics", "Chemistry",
            "Biology", "English", "History", "Business", "Engineering", "Psychology", "Electronics"
        ]
        for dept_name in sample_depts:
            db.session.add(Department(dept_name=dept_name))
        db.session.commit()

        # Add sample sections
        cs_dept = Department.query.filter_by(dept_name="Computer Science").first()
        if cs_dept:
            sections = [
                {"name": "A", "year": 1, "dept_id": cs_dept.id},
                {"name": "B", "year": 1, "dept_id": cs_dept.id},
                {"name": "A", "year": 2, "dept_id": cs_dept.id},
                {"name": "B", "year": 2, "dept_id": cs_dept.id}
            ]
            for section_data in sections:
                db.session.add(Section(**section_data))
            db.session.commit()

        # Add sample rooms
        sample_rooms = [
            {"name": "Room-101", "capacity": 50, "resources": "Projector, AC"},
            {"name": "Room-102", "capacity": 40, "resources": "Whiteboard"},
            {"name": "Lab-201", "capacity": 30, "resources": "Computers, AC"},
            {"name": "Room-103", "capacity": 60, "resources": "Smart Board"},
            {"name": "Lab-202", "capacity": 25, "resources": "Lab Equipment"}
        ]
        for room_data in sample_rooms:
            db.session.add(Classroom(**room_data))
        db.session.commit()

        # Add sample course allocations
        if cs_dept:
            sample_allocations = [
                {"dept_id": cs_dept.id, "year": 1, "semester": 1, "total_courses": 6},
                {"dept_id": cs_dept.id, "year": 1, "semester": 2, "total_courses": 6},
                {"dept_id": cs_dept.id, "year": 2, "semester": 1, "total_courses": 5},
                {"dept_id": cs_dept.id, "year": 2, "semester": 2, "total_courses": 5}
            ]
            for allocation in sample_allocations:
                db.session.add(CourseAllocation(**allocation))
            db.session.commit()

        # Add sample faculty
        sample_faculty = [
            {"faculty_name": "John Doe", "max_hours": 12, "dept_id": cs_dept.id, "email": "john@example.com"},
            {"faculty_name": "Jane Smith", "max_hours": 10, "dept_id": cs_dept.id, "email": "jane@example.com"}
        ]
        for faculty_data in sample_faculty:
            if not Faculty.query.filter_by(faculty_name=faculty_data["faculty_name"]).first():
                db.session.add(Faculty(**faculty_data))
        db.session.commit()

    # Always create sample users if they don't exist
    if User.query.count() == 0:
        # Get Computer Science department for users
        cs_dept = Department.query.filter_by(dept_name="Computer Science").first()
        if cs_dept:
            # Add sample users
            sample_users = [
                {"username": "teacher1", "role": "teacher", "full_name": "Dr. John Smith", "email": "john@example.com", "dept_id": cs_dept.id},
                {"username": "student1", "role": "student", "full_name": "Alice Smith", "email": "alice@example.com", "dept_id": cs_dept.id, "year": 1, "section_id": Section.query.filter_by(name="A", year=1, dept_id=cs_dept.id).first().id if Section.query.filter_by(name="A", year=1, dept_id=cs_dept.id).first() else None},
                {"username": "admin", "role": "admin", "full_name": "Administrator", "email": "admin@example.com"}
            ]
            for user_data in sample_users:
                if not User.query.filter_by(username=user_data["username"]).first():
                    user = User(**user_data)
                    user.set_password("password123")
                    db.session.add(user)
            db.session.commit()

        print("Sample data created with users, sections, and room occupancy tracking.")
