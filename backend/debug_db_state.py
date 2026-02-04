
import sys
from app import create_app
from models import Course, Section, Faculty, FacultyUnavailability

sys.stdout.reconfigure(encoding='utf-8')
app = create_app()

with app.app_context():
    try:
        courses = Course.query.all()
        sections = Section.query.all()
        faculty = Faculty.query.all()
        
        output = []
        
        # Check Section Load
        output.append("--- SECTION ANALYSIS ---")
        for s in sections:
            section_courses = [c for c in courses if c.year == s.year and c.dept_id == s.dept_id]
            total_hours = sum(c.hours_per_week for c in section_courses)
            output.append(f"Section {s.name} (Year {s.year}): {total_hours} hours required.")
            if total_hours > 20: 
                output.append(f"CRITICAL: Section {s.name} requires {total_hours} hours but only 20 slots available!")
            elif total_hours == 20:
                output.append(f"WARNING: Section {s.name} is fully booked (20/20). Any unavailability will fail generation.")
                
        # Check Faculty Availability
        output.append("\n--- FACULTY ANALYSIS ---")
        for f in faculty:
            assigned_hours = sum(c.hours_per_week for c in courses if c.faculty_id == f.faculty_id)
            unavailability_count = FacultyUnavailability.query.filter_by(faculty_id=f.faculty_id).count()
            available_slots = 20 - unavailability_count
            
            output.append(f"Faculty {f.faculty_name}: Assigned {assigned_hours}h. Available Slots: {available_slots}/20.")
            
            if assigned_hours > available_slots:
                output.append(f"CRITICAL: Faculty {f.faculty_name} has {assigned_hours} hours but only {available_slots} slots available!")

        with open("db_load_check.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(output))
            
        print("Load check completed.")

    except Exception as e:
        with open("db_load_check.txt", "w", encoding="utf-8") as f:
             f.write(f"ERROR: {str(e)}")
