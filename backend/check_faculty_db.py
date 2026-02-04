from app import create_app
from models import Faculty, Department

app = create_app()

with app.app_context():
    print("=== Faculty in Database ===\n")
    
    faculty_list = Faculty.query.all()
    
    if not faculty_list:
        print("NO FACULTY FOUND!")
    else:
        print(f"Total Faculty: {len(faculty_list)}\n")
        for f in faculty_list:
            dept_name = f.department.dept_name if f.department else "NO DEPT"
            print(f"ID: {f.faculty_id:3d} | Name: {f.faculty_name:30s} | Dept: {dept_name:20s} | Email: {f.email or 'N/A'}")
    
    print("\n" + "="*80)
    print("\nDepartments in Database:")
    depts = Department.query.all()
    for d in depts:
        print(f"  - {d.dept_name} (ID: {d.id})")
