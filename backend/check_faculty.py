from app import create_app
from models import Faculty

app = create_app()

with app.app_context():
    print("=== Checking Faculty Data ===")
    faculty_list = Faculty.query.all()
    
    if not faculty_list:
        print("NO FACULTY FOUND in database!")
    else:
        print(f"Found {len(faculty_list)} faculty members:")
        for f in faculty_list:
            print(f"  - ID: {f.id}, Name: {f.faculty_name}, Dept: {f.dept_name}, Email: {f.email}")
