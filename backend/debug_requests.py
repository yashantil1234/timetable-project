
import sys
from app import create_app
from extensions import db
from models import User, Faculty, SwapRequest, LeaveRequest

app = create_app()

with app.app_context():
    with open("debug_requests_out.txt", "w", encoding="utf-8") as f:
        f.write("=== USERS ===\n")
        users = User.query.all()
        for u in users:
            f.write(f"ID: {u.id}, User: {u.username}, Name: {u.full_name}, Dept: {u.dept_id}\n")

        f.write("\n=== FACULTY ===\n")
        faculty = Faculty.query.all()
        for fa in faculty:
            f.write(f"ID: {fa.faculty_id}, Name: {fa.faculty_name}, Dept: {fa.dept_id}\n")

        f.write("\n=== LEAVE REQUESTS ===\n")
        leaves = LeaveRequest.query.all()
        for l in leaves:
            f.write(f"ID: {l.id}, UserID: {l.user_id}, Type: {l.leave_type}, Status: {l.status}, Notes: {l.admin_notes}\n")

        f.write("\n=== SWAP REQUESTS ===\n")
        swaps = SwapRequest.query.all()
        for s in swaps:
            f.write(f"ID: {s.id}, FacultyID: {s.requesting_faculty_id}, Status: {s.status}, Notes: {s.admin_notes}\n")
