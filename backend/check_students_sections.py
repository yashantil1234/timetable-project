"""
Check students without sections and help assign them
"""
from models.db import db
from models.user import User
from models.department import Department
from models.section import Section

def check_students_without_sections():
    print("=" * 60)
    print("STUDENTS WITHOUT SECTIONS REPORT")
    print("=" * 60)
    
    # Get all students
    students = User.query.filter_by(role='student').all()
    
    total = len(students)
    without_section = [s for s in students if s.section_id is None]
    
    print(f"\nTotal students: {total}")
    print(f"Students without section: {len(without_section)}")
    print(f"Students with section: {total - len(without_section)}")
    
    if without_section:
        print("\n" + "=" * 60)
        print("STUDENTS NEEDING SECTION ASSIGNMENT")
        print("=" * 60)
        
        # Group by department and year
        by_dept_year = {}
        for student in without_section:
            key = (student.dept_id, student.year)
            if key not in by_dept_year:
                by_dept_year[key] = []
            by_dept_year[key].append(student)
        
        for (dept_id, year), students_list in sorted(by_dept_year.items()):
            dept = Department.query.get(dept_id) if dept_id else None
            dept_name = dept.dept_name if dept else "Unknown"
            
            print(f"\n{dept_name} - Year {year}: {len(students_list)} students")
            
            # Check available sections
            sections = Section.query.filter_by(dept_id=dept_id, year=year).all()
            if sections:
                print(f"  Available sections: {', '.join([s.name for s in sections])}")
                for student in students_list[:3]:  # Show first 3
                    print(f"    - {student.username} ({student.full_name})")
                if len(students_list) > 3:
                    print(f"    ... and {len(students_list) - 3} more")
            else:
                print(f"  ⚠️ NO SECTIONS AVAILABLE! Create sections for {dept_name} Year {year} first")
                for student in students_list[:3]:  # Show first 3
                    print(f"    - {student.username} ({student.full_name})")
                if len(students_list) > 3:
                    print(f"    ... and {len(students_list) - 3} more")
        
        print("\n" + "=" * 60)
        print("NEXT STEPS:")
        print("=" * 60)
        print("1. Go to Admin Portal > Sections")
        print("2. Create sections for each department/year combination above")
        print("3. Then you can manually assign students to sections")
        print("   OR use the admin interface to edit each student")
    else:
        print("\n✓ All students have sections assigned!")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    from app import create_app
    app = create_app()
    with app.app_context():
        check_students_without_sections()
