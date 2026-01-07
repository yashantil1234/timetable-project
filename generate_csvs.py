import sys
import os
sys.path.append('backend')

from app2 import app, db, export_csvs, create_sample_data, generate_timetable_internal, Timetable, CourseAllocation, Course, Faculty, Section, Classroom, Department, User, RoomOccupancy

with app.app_context():
    db.create_all()

    # Clear existing data to ensure fresh sample data
    print("Clearing existing data...")
    try:
        Timetable.query.delete()
        CourseAllocation.query.delete()
        Course.query.delete()
        Faculty.query.delete()
        Section.query.delete()
        Classroom.query.delete()
        Department.query.delete()
        User.query.delete()
        RoomOccupancy.query.delete()
        db.session.commit()
        print("Existing data cleared successfully!")
    except Exception as e:
        db.session.rollback()
        print(f"Error clearing data: {e}")

    create_sample_data()
    # Generate timetable
    print("Generating timetable...")
    timetable_result = generate_timetable_internal()
    if timetable_result.get("success"):
        print("Timetable generated successfully!")
    else:
        print(f"Timetable generation failed: {timetable_result.get('error', 'Unknown error')}")
    success = export_csvs()
    if success:
        print("CSV files generated successfully!")
    else:
        print("Failed to generate CSV files.")
