
from app import create_app
from models import Course, Section, Department

app = create_app()

with app.app_context():
    with open("data_dump.txt", "w") as f:
        f.write("--- Departments ---\n")
        for d in Department.query.all():
            f.write(f"ID: {d.id}, Name: {d.dept_name}\n")
            
        f.write("\n--- Courses ---\n")
        for c in Course.query.all():
            f.write(f"ID: {c.course_id}, Name: {c.name}, DeptID: {c.dept_id}, Year: {c.year}, Semester: {c.semester}\n")
            
        f.write("\n--- Sections ---\n")
        for s in Section.query.all():
            f.write(f"ID: {s.id}, Name: {s.name}, DeptID: {s.dept_id}, Year: {s.year}\n")
    print("Data written to data_dump.txt")
