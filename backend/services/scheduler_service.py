"""
Timetable Scheduler Service using OR-Tools Constraint Programming
Handles the core logic for generating timetables
"""

import os
import pandas as pd
from ortools.sat.python import cp_model
from extensions import db
from models import (
    Course, Faculty, Classroom, Section, Timetable, 
    FacultyUnavailability
)
from services.email_service import send_email


def generate_timetable_internal():
    """Generate timetable using constraint programming"""
    courses = Course.query.all()
    faculty = Faculty.query.all()
    rooms = Classroom.query.all()
    sections = Section.query.all()

    if not courses or not faculty or not rooms or not sections:
        return {"error": "Need courses, faculty, rooms, and sections to generate timetable"}

    time_slots = ["Mon_09", "Mon_11", "Mon_01", "Mon_03",
                  "Tue_09", "Tue_11", "Tue_01", "Tue_03",
                  "Wed_09", "Wed_11", "Wed_01", "Wed_03",
                  "Thu_09", "Thu_11", "Thu_01", "Thu_03",
                  "Fri_09", "Fri_11", "Fri_01", "Fri_03"]

    model = cp_model.CpModel()
    assignments = {}

    faculty_dict = {f.faculty_id: f for f in faculty}
    room_dict = {r.room_id: r for r in rooms}

    # --- Fetch all unavailability records into an efficient lookup set ---
    unavailable_slots = {
        (u.faculty_id, f"{u.day}_{u.start_time}")
        for u in FacultyUnavailability.query.all()
    }

    # Decision variables
    for c in courses:
        assignments[c.course_id] = {}
        relevant_sections = Section.query.filter_by(year=c.year, dept_id=c.dept_id).all()
        for section in relevant_sections:
            assignments[c.course_id][section.id] = {}
            for slot in time_slots:
                for r in rooms:
                    assignments[c.course_id][section.id][(slot, r.room_id)] = model.NewBoolVar(
                        f"course_{c.course_id}_section_{section.id}_{slot}_{r.name}"
                    )

    # --- CONSTRAINTS ---

    # Constraint 0.1: Pre-assign fixed classes
    for c in courses:
        if c.is_fixed and c.fixed_day and c.fixed_slot and c.fixed_room_id:
            fixed_time_slot = f"{c.fixed_day}_{c.fixed_slot}"
            relevant_sections = Section.query.filter_by(year=c.year, dept_id=c.dept_id).all()
            for section in relevant_sections:
                if fixed_time_slot in time_slots:
                    model.Add(assignments[c.course_id][section.id][(fixed_time_slot, c.fixed_room_id)] == 1)

    # Constraint 0.2: Block assignments in faculty's unavailable slots
    for f in faculty:
        for slot in time_slots:
            if (f.faculty_id, slot) in unavailable_slots:
                for c in courses:
                    if c.faculty_id == f.faculty_id:
                        relevant_sections = Section.query.filter_by(year=c.year, dept_id=c.dept_id).all()
                        for section in relevant_sections:
                            for r in rooms:
                                if (c.course_id in assignments and
                                    section.id in assignments[c.course_id] and
                                    (slot, r.room_id) in assignments[c.course_id][section.id]):
                                    model.Add(assignments[c.course_id][section.id][(slot, r.room_id)] == 0)

    # Constraint 1: Each course is scheduled for its required 'hours_per_week'
    for c in courses:
        relevant_sections = Section.query.filter_by(year=c.year, dept_id=c.dept_id).all()
        for section in relevant_sections:
            if c.course_id in assignments and section.id in assignments[c.course_id]:
                if c.hours_per_week > 0:
                    model.Add(sum(assignments[c.course_id][section.id].values()) == c.hours_per_week)
                else:
                    model.Add(sum(assignments[c.course_id][section.id].values()) == 0)

    # Constraint 2: Room conflicts (one class per room at any time)
    for slot in time_slots:
        for r in rooms:
            room_assignments = []
            for c in courses:
                relevant_sections = Section.query.filter_by(year=c.year, dept_id=c.dept_id).all()
                for section in relevant_sections:
                    if (c.course_id in assignments and
                        section.id in assignments[c.course_id] and
                        (slot, r.room_id) in assignments[c.course_id][section.id]):
                        room_assignments.append(assignments[c.course_id][section.id][(slot, r.room_id)])
            if room_assignments:
                model.Add(sum(room_assignments) <= 1)

    # Constraint 3: Faculty conflicts (faculty teaches one class at a time)
    for slot in time_slots:
        for f in faculty:
            faculty_assignments = []
            for c in courses:
                if c.faculty_id == f.faculty_id:
                    relevant_sections = Section.query.filter_by(year=c.year, dept_id=c.dept_id).all()
                    for section in relevant_sections:
                        for r in rooms:
                            if (c.course_id in assignments and
                                section.id in assignments[c.course_id] and
                                (slot, r.room_id) in assignments[c.course_id][section.id]):
                                faculty_assignments.append(assignments[c.course_id][section.id][(slot, r.room_id)])
            if faculty_assignments:
                model.Add(sum(faculty_assignments) <= 1)

    # Constraint 4: Section conflicts (section attends one class at a time)
    for slot in time_slots:
        for section in sections:
            section_assignments = []
            for c in courses:
                if c.year == section.year and c.dept_id == section.dept_id:
                    for r in rooms:
                        if (c.course_id in assignments and
                            section.id in assignments[c.course_id] and
                            (slot, r.room_id) in assignments[c.course_id][section.id]):
                            section_assignments.append(assignments[c.course_id][section.id][(slot, r.room_id)])
            if section_assignments:
                model.Add(sum(section_assignments) <= 1)

    # Constraint 5: Max classes per day for a section
    days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
    for section in sections:
        for day in days:
            daily_slots = [slot for slot in time_slots if slot.startswith(day)]
            
            daily_class_sum = []
            for c in courses:
                if c.year == section.year and c.dept_id == section.dept_id:
                    for slot in daily_slots:
                        for r in rooms:
                            if (c.course_id in assignments and
                                section.id in assignments[c.course_id] and
                                (slot, r.room_id) in assignments[c.course_id][section.id]):
                                daily_class_sum.append(assignments[c.course_id][section.id][(slot, r.room_id)])
            
            if daily_class_sum:
                model.Add(sum(daily_class_sum) <= section.max_hours_per_day)

    # --- SOLVER AND OUTPUT ---
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0
    status = solver.Solve(model)

    try:
        Timetable.query.delete()
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return {"error": f"Failed to clear existing timetable: {str(e)}"}

    timetable_entries = []
    timetable_data = []

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for c in courses:
            relevant_sections = Section.query.filter_by(year=c.year, dept_id=c.dept_id).all()
            for section in relevant_sections:
                if (c.course_id in assignments and
                    section.id in assignments[c.course_id]):
                    for (slot, room_id), var in assignments[c.course_id][section.id].items():
                        if solver.Value(var) == 1:
                            entry = Timetable(
                                course_id=c.course_id,
                                section_id=section.id,
                                faculty_id=c.faculty_id,
                                room_id=room_id,
                                day=slot.split("_")[0],
                                start_time=slot.split("_")[1]
                            )
                            timetable_entries.append(entry)
                            timetable_data.append({
                                "course": c.name,
                                "section": section.name,
                                "faculty": faculty_dict[c.faculty_id].faculty_name if c.faculty_id else "N/A",
                                "room": room_dict[room_id].name,
                                "day": entry.day,
                                "start_time": entry.start_time,
                                "year": c.year,
                                "semester": c.semester
                            })
        try:
            db.session.add_all(timetable_entries)
            db.session.commit()
            os.makedirs("output", exist_ok=True)

            # Save CSV
            file_path = "output/timetable_final.csv"
            pd.DataFrame(timetable_data).to_csv(file_path, index=False)
            print("Timetable generated successfully!")

            # --- Send email with attachment ---
            try: 
                faculty_emails = [f.email for f in faculty if f.email]
                send_email(
                    subject="New Timetable Generated",
                    recipients=faculty_emails,
                    body="Hello,\n\nThe new timetable has been updated successfully please check it.\n\nRegards,\nTimetable System",
                    attachment_path=file_path
                )
            except Exception as e:
                print(f"⚠️ Failed to send email: {str(e)}")

            return {"success": True, "message": "Timetable generated successfully and emailed"}

        except Exception as e:
            db.session.rollback()
            return {"success": False, "message": f"Error: {str(e)}"}

    else:
        return {"error": "Could not generate a feasible timetable. Try reducing constraints or adding more resources."}
