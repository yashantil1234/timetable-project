import os
import io
import pandas as pd
from flask import send_file, jsonify
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, make_response
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import or_
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
from ortools.sat.python import cp_model
from flask_mail import Mail, Message


# ---------- FLASK SETUP ----------
app = Flask(__name__)
CORS(app)
app.url_map.strict_slashes = False
CORS(app, origins=['http://localhost:5173', 'http://localhost:3000'])

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, "timetable_enhanced.db")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "TimetableSecretKey2025")

db = SQLAlchemy(app)
# Mail configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False

# Use environment variables for security
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USER")   # your Gmail
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASS")   # your App Password
app.config['MAIL_DEFAULT_SENDER'] = ("Timetable System", os.getenv("MAIL_USER"))

mail = Mail(app)

# ---------- ENHANCED MODELS ----------
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # "teacher", "student", or "admin"
    full_name = db.Column(db.String(100), nullable=True)
    email = db.Column(db.String(100), nullable=True)
    dept_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=True)
    year = db.Column(db.Integer, nullable=True)
    section_id = db.Column(db.Integer, db.ForeignKey("sections.id"), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    
    room_occupancies = db.relationship("RoomOccupancy", backref="user", lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Department(db.Model):
    __tablename__ = "departments"
    id = db.Column(db.Integer, primary_key=True)
    dept_name = db.Column(db.String(100), nullable=False, unique=True)

    faculty = db.relationship("Faculty", backref="department", lazy=True)
    courses = db.relationship("Course", backref="department", lazy=True)
    course_allocations = db.relationship("CourseAllocation", backref="department", lazy=True)
    sections = db.relationship("Section", backref="department", lazy=True)
    users = db.relationship("User", backref="department", lazy=True)

class Faculty(db.Model):
    __tablename__ = "faculty"
    faculty_id = db.Column(db.Integer, primary_key=True)
    faculty_name = db.Column(db.String(100), nullable=False)
    max_hours = db.Column(db.Integer, default=12)
    dept_id = db.Column(db.Integer, db.ForeignKey("departments.id"))
    email= db.Column(db.String(100), nullable=False, unique=True)
class Section(db.Model):
    __tablename__ = "sections"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(1), nullable=False)  # A, B, C, etc.
    year = db.Column(db.Integer, nullable=False)
    dept_id = db.Column(db.Integer, db.ForeignKey("departments.id"))
    
    users = db.relationship("User", backref="section", lazy=True)
    timetables = db.relationship("Timetable", backref="section", lazy=True)
    max_hours_per_day = db.Column(db.Integer, default=5) 
    __table_args__ = (db.UniqueConstraint("name", "year", "dept_id", name="unique_section_per_year_dept"),)

class Course(db.Model):
    __tablename__ = "courses"
    course_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    credits = db.Column(db.Integer, nullable=True)
    year = db.Column(db.Integer, nullable=False, default=1)
    semester = db.Column(db.Integer, nullable=False, default=1)
    dept_id = db.Column(db.Integer, db.ForeignKey("departments.id"))
    faculty_id = db.Column(db.Integer, db.ForeignKey("faculty.faculty_id"))
    hours_per_week = db.Column(db.Integer, nullable=False, default=6)
    is_fixed = db.Column(db.Boolean, default=False)
    faculty = db.relationship("Faculty", backref="courses")

 
    fixed_day = db.Column(db.String(20), nullable=True)
    fixed_slot = db.Column(db.String(20), nullable=True)
    fixed_room_id = db.Column(db.Integer, db.ForeignKey("classrooms.room_id"), nullable=True)
class Classroom(db.Model):
    __tablename__ = "classrooms"
    room_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable= True)
    capacity = db.Column(db.Integer, nullable=False)
    resources = db.Column(db.String(200))
    
    occupancies = db.relationship("RoomOccupancy", backref="room", lazy=True)

class RoomOccupancy(db.Model):
    __tablename__ = "room_occupancy"
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("classrooms.room_id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="free")  # "free", "occupied"
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.String(200), nullable=True)

class CourseAllocation(db.Model):
    __tablename__ = "course_allocations"
    id = db.Column(db.Integer, primary_key=True)
    dept_id = db.Column(db.Integer, db.ForeignKey("departments.id"))
    year = db.Column(db.Integer, nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    total_courses = db.Column(db.Integer, nullable=False, default=0)
    allocated_courses = db.Column(db.Integer, nullable=False, default=0)
    
    __table_args__ = (db.UniqueConstraint('dept_id', 'year', 'semester', name='_dept_year_sem_uc'),)

class Timetable(db.Model):
    __tablename__ = "timetable"
    timetable_id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.course_id"))
    section_id = db.Column(db.Integer, db.ForeignKey("sections.id"))
    faculty_id = db.Column(db.Integer, db.ForeignKey("faculty.faculty_id"))
    room_id = db.Column(db.Integer, db.ForeignKey("classrooms.room_id"))
    day = db.Column(db.String(20))
    slot = db.Column(db.String(20))
    
    course = db.relationship("Course")
    faculty = db.relationship("Faculty")
    room = db.relationship("Classroom")
    # In app.py, add this to your "ENHANCED MODELS" section

class SwapRequest(db.Model):
    __tablename__ = 'swap_requests'
    id = db.Column(db.Integer, primary_key=True)
    
    # Who is making the request (links to the faculty table)
    requesting_faculty_id = db.Column(db.Integer, db.ForeignKey('faculty.faculty_id'), nullable=False)
    
    # The specific class session they want to move
    original_timetable_id = db.Column(db.Integer, db.ForeignKey('timetable.timetable_id'), nullable=False)
    
    # The new time they are proposing
    proposed_day = db.Column(db.String(20), nullable=False)
    proposed_slot = db.Column(db.String(20), nullable=False)
    
    # The current state of the request
    status = db.Column(db.String(20), nullable=False, default='pending') # pending, approved, rejected
    reason = db.Column(db.Text, nullable=True) # Teacher's reason for the swap
    admin_notes = db.Column(db.Text, nullable=True) # Admin's notes on approval/rejection
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Define relationships for easy data access
    requesting_faculty = db.relationship("Faculty", foreign_keys=[requesting_faculty_id])
    original_timetable_entry = db.relationship("Timetable", foreign_keys=[original_timetable_id])
   # --- NEW DATABASE MODEL ---
class FacultyUnavailability(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    faculty_id = db.Column(db.Integer, db.ForeignKey("faculty.faculty_id"), nullable=False)
    day = db.Column(db.String(20), nullable=False)
    slot = db.Column(db.String(20), nullable=False)
    
    faculty = db.relationship("Faculty", backref="unavailabilities")
    __table_args__ = (db.UniqueConstraint('faculty_id', 'day', 'slot', name='_unique_faculty_unavailability'),)

# Leave Request System Model
class LeaveRequest(db.Model):
    __tablename__ = "leave_requests"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    leave_type = db.Column(db.String(50), nullable=False)  # sick, vacation, personal, emergency, medical, family
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default="pending")  # pending, approved, rejected
    approved_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    admin_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship("User", foreign_keys=[user_id], backref="leave_requests")
    approver = db.relationship("User", foreign_keys=[approved_by], backref="approved_leave_requests")

# ---------- JWT AUTH DECORATOR ----------
# Place near your other helpers (e.g., under token_required or helper section)
def _extract_token_from_request():
    # Prefer standard Authorization: Bearer <token>
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        print(f"DEBUG: Found Bearer token: {token[:20]}...")
        return token
    # Backward compatible with existing x-access-token
    x_token = request.headers.get("x-access-token")
    if x_token:
        print(f"DEBUG: Found x-access-token: {x_token[:20]}...")
    else:
        print("DEBUG: No token found in headers")
        print(f"DEBUG: Available headers: {list(request.headers.keys())}")
    return x_token
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token =  _extract_token_from_request()
        if not token:
            return jsonify({"error": "Token missing"}), 401
        try:
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = db.session.get(User, data["user_id"])
            if not current_user or not current_user.is_active:
                return jsonify({"error": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"error": "Token invalid", "details": str(e)}), 401
        return f(current_user, *args, **kwargs)
    return decorated # here 

def admin_required(f):
    @wraps(f)
    def wrapper(current_user, *args, **kwargs):
        if current_user.role != "admin":
            return jsonify({"error": "Admin only"}), 403
        return f(current_user, *args, **kwargs)
    return wrapper

def teacher_required(f):
    @wraps(f)
    def wrapper(current_user, *args, **kwargs):
        if current_user.role not in ["teacher", "admin"]:
            return jsonify({"error": "Teacher or admin only"}), 403
        return f(current_user, *args, **kwargs)
    return wrapper

# ---------- HELPER FUNCTIONS ----------
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
                "student_count": len(s.users),"max_hours_per_day": s.max_hours_per_day
            } for s in sections])
            sections_df.to_csv("data/sections.csv", index=False)
        
        # Faculty
        faculty = Faculty.query.all()
        if faculty:
            faculty_df = pd.DataFrame([{
                "faculty_name": f.faculty_name, "max_hours": f.max_hours,
                "dept_name": f.department.dept_name,"email":f.email,"faculty_id":f.faculty_id
            } for f in faculty])
            faculty_df.to_csv("data/faculty.csv", index=False)
        
        # Courses
        courses = Course.query.all()
        if courses:
            courses_df = pd.DataFrame([{
                "name": c.name, "type": c.type, "credits": c.credits,
                "year": c.year, "semester": c.semester,
                "dept_name": c.department.dept_name,"dept_id":c.dept_id,
                "faculty_name": Faculty.query.get(c.faculty_id).faculty_name if Faculty.query.get(c.faculty_id) else "Unknown"
            } for c in courses])
            courses_df.to_csv("data/courses.csv", index=False)
        
        # Rooms
        rooms = Classroom.query.all()
        if rooms:
            rooms_df = pd.DataFrame([{
                "room_id": r.room_id,"name":r.name, "capacity": r.capacity, "resources": r.resources,
                "current_status": "free"
            } for r in rooms])
            rooms_df.to_csv("data/classrooms.csv", index=False)
        
        # Timetable
        timetable = Timetable.query.all()
        if timetable:
            timetable_df = pd.DataFrame([{
                "course": t.course.name, "section": t.section.name, "year": t.section.year,
                "faculty": t.faculty.faculty_name, "room": t.room.name,
                "day": t.day, "slot": t.slot, "department": t.course.department.dept_name,
                "credits": t.course.credits, "type": t.course.type
            } for t in timetable])
            timetable_df.to_csv("data/enhanced_timetable.csv", index=False)
        
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

def create_sample_data():
    """Create sample data if database is empty"""
    if Department.query.count() == 0:
        # Add sample departments
        sample_depts = ["Computer Science", "Mathematics", "Physics", "Electronics"]
        for dept_name in sample_depts:
            db.session.add(Department(dept_name=dept_name))
        db.session.commit()

        # Add sample faculty
        cs_dept = Department.query.filter_by(dept_name="Computer Science").first()
        math_dept = Department.query.filter_by(dept_name="Mathematics").first()
        physics_dept = Department.query.filter_by(dept_name="Physics").first()
        electronics_dept = Department.query.filter_by(dept_name="Electronics").first()

        sample_faculty = [
            {"faculty_name": "Dr. John Smith", "dept_id": cs_dept.id if cs_dept else None, "email": "john.smith@university.edu", "max_hours": 12},
            {"faculty_name": "Prof. Sarah Johnson", "dept_id": cs_dept.id if cs_dept else None, "email": "sarah.johnson@university.edu", "max_hours": 10},
            {"faculty_name": "Dr. Michael Brown", "dept_id": math_dept.id if math_dept else None, "email": "michael.brown@university.edu", "max_hours": 12},
            {"faculty_name": "Prof. Emily Davis", "dept_id": physics_dept.id if physics_dept else None, "email": "emily.davis@university.edu", "max_hours": 11},
            {"faculty_name": "Dr. Robert Wilson", "dept_id": electronics_dept.id if electronics_dept else None, "email": "robert.wilson@university.edu", "max_hours": 12}
        ]
        for faculty_data in sample_faculty:
            db.session.add(Faculty(**faculty_data))
        db.session.commit()

        # Add sample courses
        faculty_list = Faculty.query.all()
        if faculty_list and cs_dept:
            sample_courses = [
                {"name": "Data Structures", "type": "theory", "credits": 4, "year": 2, "semester": 1, "dept_id": cs_dept.id, "faculty_id": faculty_list[0].faculty_id, "hours_per_week": 4},
                {"name": "Algorithms", "type": "theory", "credits": 4, "year": 2, "semester": 2, "dept_id": cs_dept.id, "faculty_id": faculty_list[0].faculty_id, "hours_per_week": 4},
                {"name": "Database Systems", "type": "theory", "credits": 3, "year": 3, "semester": 1, "dept_id": cs_dept.id, "faculty_id": faculty_list[1].faculty_id, "hours_per_week": 3},
                {"name": "Computer Networks", "type": "theory", "credits": 3, "year": 3, "semester": 2, "dept_id": cs_dept.id, "faculty_id": faculty_list[1].faculty_id, "hours_per_week": 3},
                {"name": "Calculus I", "type": "theory", "credits": 4, "year": 1, "semester": 1, "dept_id": math_dept.id if math_dept else cs_dept.id, "faculty_id": faculty_list[2].faculty_id, "hours_per_week": 4},
                {"name": "Linear Algebra", "type": "theory", "credits": 3, "year": 1, "semester": 2, "dept_id": math_dept.id if math_dept else cs_dept.id, "faculty_id": faculty_list[2].faculty_id, "hours_per_week": 3},
                {"name": "Physics I", "type": "theory", "credits": 4, "year": 1, "semester": 1, "dept_id": physics_dept.id if physics_dept else cs_dept.id, "faculty_id": faculty_list[3].faculty_id, "hours_per_week": 4},
                {"name": "Digital Electronics", "type": "theory", "credits": 3, "year": 2, "semester": 1, "dept_id": electronics_dept.id if electronics_dept else cs_dept.id, "faculty_id": faculty_list[4].faculty_id, "hours_per_week": 3}
            ]
            for course_data in sample_courses:
                db.session.add(Course(**course_data))
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
        
        # Add sample users
        sample_users = [
            {"username": "teacher1", "role": "teacher", "full_name": "John Doe", "email": "john@example.com", "dept_id": cs_dept.id},
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
def send_email(subject, recipients, body, attachment_path=None):
    with app.app_context():
        msg = Message(subject, recipients=recipients)
        msg.body = body

        # Attach a file (like timetable CSV)
        if attachment_path:
            with open(attachment_path, "rb") as f:
                msg.attach(
                    filename=os.path.basename(attachment_path),
                    content_type="text/csv",
                    data=f.read()
                )

    mail.send(msg)
    print(f"✅ Email sent to {recipients}")


# ---------- MAIN ----------

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
        (u.faculty_id, f"{u.day}_{u.slot}")
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
                                slot=slot.split("_")[1]
                            )
                            timetable_entries.append(entry)
                            timetable_data.append({
                                "course": c.name,
                                "section": section.name,
                                "faculty": faculty_dict[c.faculty_id].faculty_name if c.faculty_id else "N/A",
                                "room": room_dict[room_id].name,
                                "day": entry.day,
                                "slot": entry.slot,
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
            recipients=faculty_emails,   # or fetch faculty emails here
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
# Initialize database and create sample data if needed
@app.route("/admin/departments", methods=["GET", "POST"])
@token_required
@admin_required
def admin_departments(current_user):
    if request.method == "GET":
        try:
            depts = Department.query.all()
            return jsonify([{"id": d.id, "dept_name": d.dept_name} for d in depts])
        except Exception as e:
            return jsonify({"error": f"Failed to fetch departments: {str(e)}"}), 500
    else:
        try:
            data = request.json
            if not data or not data.get("dept_name"):
                return jsonify({"error": "Department name is required"}), 400
            name = data["dept_name"].strip()
            if Department.query.filter_by(dept_name=name).first():
                return jsonify({"error": "Department already exists"}), 400
            dept = Department(dept_name=name)
            db.session.add(dept)
            db.session.commit()
            export_csvs()
            return jsonify({"message": "Department added", "dept_name": dept.dept_name}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to add department: {str(e)}"}), 500

@app.route("/admin/faculty", methods=["GET", "POST"])
@token_required
@admin_required
def admin_faculty(current_user):
    if request.method == "GET":
        try:
            faculty = Faculty.query.all()
            return jsonify([
                {
                    "id": f.faculty_id,
                    "name": f.faculty_name,
                    "dept_name": f.department.dept_name if f.department else None,
                    "max_hours": f.max_hours
                } for f in faculty
            ])
        except Exception as e:
            return jsonify({"error": f"Failed to fetch faculty: {str(e)}"}), 500
    else:
        try:
            data = request.json
            if not data or not data.get("faculty_name") or not data.get("dept_name"):
                return jsonify({"error": "Faculty name and department are required"}), 400
            dept = Department.query.filter_by(dept_name=data["dept_name"]).first()
            if not dept:
                return jsonify({"error": "Department not found"}), 404
            if Faculty.query.filter_by(faculty_name=data["faculty_name"].strip()).first():
                return jsonify({"error": "Faculty member already exists"}), 400
            faculty = Faculty(
                faculty_name=data["faculty_name"].strip(),
                max_hours=data.get("max_hours", 12),
                dept_id=dept.id,
                email=data["email"].strip()
            )
            db.session.add(faculty)
            db.session.commit()
            export_csvs()
            return jsonify({"message": "Faculty added successfully!", "faculty_id": faculty.faculty_id})
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to add faculty: {str(e)}"}), 500

@app.route("/admin/courses", methods=["GET", "POST","put","delete"])
@token_required
@admin_required
def admin_courses(current_user):
    if request.method == "GET":
        try:
            courses = Course.query.all()
            return jsonify([
                {
                    "id": c.course_id,
                    "name": c.name,
                    "type": c.type,
                    "credits": c.credits,
                    "hours_per_week": c.hours_per_week, # Added field
                    "year": c.year,
                    "semester": c.semester,
                    "dept_name": c.department.dept_name if c.department else None,
                    "faculty_name": c.faculty.faculty_name if c.faculty else None,
                    # --- Added fields for fixed slots ---
                    "is_fixed": c.is_fixed,
                    "fixed_day": c.fixed_day,
                    "fixed_slot": c.fixed_slot,
                    "fixed_room_id": c.fixed_room_id
                }
                for c in courses
            ])
        except Exception as e:
            return jsonify({"error": f"Failed to fetch courses: {str(e)}"}), 500
    elif request.method == "PUT":
        data = request.json
        course = Course.query.get(data.get("course_id"))
        if not course:
            return {"error": "Course not found"}, 404
        course.name = data.get("name", course.name)
        db.session.commit()
        return {"message": "Course updated"}, 200

    elif request.method == "DELETE":
        course = Course.query.get(request.args.get("course_id"))
        if not course:
            return {"error": "Course not found"}, 404
        db.session.delete(course)
        db.session.commit()
        return {"message": "Course deleted"}, 200
    
    elif request.method == "POST":
        try:
            data = request.json
            
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            # Note: `hours_per_week` is now a recommended field
            required_fields = ["name", "type", "dept_name", "year", "semester",]
            missing_fields = [field for field in required_fields if data.get(field) is None]
            if missing_fields:
                return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400
            
            dept = Department.query.filter_by(dept_name=data["dept_name"]).first()
            if not dept:
                return jsonify({"error": f"Department '{data['dept_name']}' not found"}), 404
            
            faculty_id = data.get("faculty_id")
            if faculty_id:
                faculty = Faculty.query.get(faculty_id)
                if not faculty:
                    return jsonify({"error": f"Faculty with ID {faculty_id} not found"}), 404
            
            # --- Logic for handling fixed slots ---
            is_fixed = data.get("is_fixed", False)
            fixed_day = data.get("fixed_day")
            fixed_slot = data.get("fixed_slot")
            fixed_room_id = data.get("fixed_room_id")

            if is_fixed:
                if not all([fixed_day, fixed_slot, fixed_room_id]):
                    return jsonify({"error": "For a fixed class, 'fixed_day', 'fixed_slot', and 'fixed_room_id' are required."}), 400
                
                # Validate that the fixed room exists
                if not Classroom.query.get(fixed_room_id):
                    return jsonify({"error": f"Fixed room with ID {fixed_room_id} not found."}), 404
            # --- End of fixed slot logic ---

            existing_course = Course.query.filter_by(
                name=data["name"].strip(),
                dept_id=dept.id,
                year=data["year"],
                semester=data["semester"]
            ).first()
            if existing_course:
                return jsonify({"error": "Course already exists for this department/year/semester"}), 400
            
            new_course = Course(
                name=data["name"].strip(),
                type=data["type"].strip(),
                credits=data.get("credits", 0),
                hours_per_week=data.get("hours_per_week", 4), # Added with a default value of 4
                dept_id=dept.id,
                faculty_id=faculty_id,
                year=data["year"],
                semester=data["semester"],
                # --- Pass new fixed slot values to the constructor ---
                is_fixed=is_fixed,
                fixed_day=fixed_day,
                fixed_slot=fixed_slot,
                fixed_room_id=fixed_room_id
            )
            
            db.session.add(new_course)
            db.session.commit()
            return jsonify({
                "message": "Course created successfully",
                "course": {
                    "id": new_course.course_id,
                    "name": new_course.name,
                    "type": new_course.type,
                    "hours_per_week": new_course.hours_per_week, # Added to response
                    "dept_name": dept.dept_name,
                    "faculty_id": new_course.faculty_id,
                    "year": new_course.year,
                    "semester": new_course.semester,
                    # --- Added to response ---
                    "is_fixed": new_course.is_fixed,
                    "fixed_day": new_course.fixed_day,
                    "fixed_slot": new_course.fixed_slot,
                    "fixed_room_id": new_course.fixed_room_id
                }
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to create course: {str(e)}"}), 500

@app.route("/admin/rooms", methods=["GET", "POST"])
@token_required
@admin_required
def admin_rooms(current_user):
    if request.method == "GET":
        return get_rooms()
    else:
        return add_room()

@app.route("/admin/sections", methods=["GET", "POST"])
@token_required
@admin_required
def admin_sections(current_user):
    if request.method == "GET":
        try:
            dept_name = request.args.get("dept_name")
            year = request.args.get("year")
            query = Section.query
            if dept_name:
                dept = Department.query.filter_by(dept_name=dept_name).first()
                if not dept:
                    return jsonify([]), 200
                query = query.filter_by(dept_id=dept.id)
            if year:
                query = query.filter_by(year=int(year))
            sections = query.order_by(Section.year, Section.name).all()
            result = []
            for s in sections:
                student_count = User.query.filter_by(role='student', section_id=s.id).count()
                result.append({
                    "id": s.id,
                    "name": s.name,
                    "year": s.year,
                    "dept_name": s.department.dept_name if s.department else None,
                    "student_count": student_count,
                    "max_hours_per_day": s.max_hours_per_day
                })
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": f"Failed to fetch sections: {str(e)}"}), 500
    else:
        try:
            data = request.json or {}
            dept_name = data.get("dept_name")
            year = data.get("year")
            name = data.get("name")
            max_hours = data.get("max_hours_per_day", 5)

            if not dept_name or year is None:
                return jsonify({"error": "dept_name and year are required"}), 400
            try:
                year = int(year)
                if year < 1 or year > 4:
                    return jsonify({"error": "Year must be between 1 and 4"}), 400
            except (ValueError, TypeError):
                return jsonify({"error": "Year must be an integer"}), 400

            dept = Department.query.filter_by(dept_name=dept_name).first()
            if not dept:
                return jsonify({"error": "Department not found"}), 404

            letter = (name or "").strip().upper() if name else None
            if letter:
                if Section.query.filter_by(dept_id=dept.id, year=year, name=letter).first():
                    return jsonify({"error": f"Section {letter} already exists"}), 400
            else:
                used = {s.name for s in Section.query.filter_by(dept_id=dept.id, year=year).all()}
                for ch in [chr(i) for i in range(65, 91)]: # A-Z
                    if ch not in used:
                        letter = ch
                        break
                if not letter:
                    return jsonify({"error": "No available section letters left"}), 400

            section = Section(name=letter, year=year, dept_id=dept.id, max_hours_per_day=max_hours)
            db.session.add(section)
            db.session.commit()
            
            return jsonify({
                "message": f"Section {letter} added for {dept_name} Year {year}", 
                "section": {
                    "id": section.id, 
                    "name": section.name, 
                    "year": section.year,
                    "max_hours_per_day": section.max_hours_per_day
                }
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to add section: {str(e)}"}), 500
@app.route("/admin/students", methods=["GET", "POST"])
@token_required
@admin_required
def admin_students(current_user):
    if request.method == "GET":
        try:
            students = User.query.filter_by(role='student').all()
            result = [{
                "id": s.id,
                "username": s.username,
                "dept_name": s.department.dept_name if s.department else None,
                "year": s.year,
                "section_name": s.section.name if s.section else None
            } for s in students]
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": f"Failed to fetch students: {str(e)}"}), 500
    else:
        try:
            data = request.json or {}
            username = (data.get("username") or "").strip()
            password = data.get("password")
            dept_id = data.get("dept_id")
            year = data.get("year")
            section_id = data.get("section_id")
            if not all([username, password, dept_id, year, section_id]):
                return jsonify({"error": "Username, password, dept_id, year, and section_id are required"}), 400
            if User.query.filter_by(username=username).first():
                return jsonify({"error": "Username already exists"}), 400
            user = User(username=username, role="student", dept_id=dept_id, year=year, section_id=section_id)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            export_csvs()
            return jsonify({"message": "Student created successfully", "student_id": user.id}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to create student: {str(e)}"}), 500

@app.route("/admin/students/<int:student_id>", methods=["GET", "PUT", "DELETE"])
@token_required
@admin_required
def admin_manage_student(current_user, student_id):
    student = User.query.filter_by(id=student_id, role='student').first()
    if not student:
        return jsonify({"error": "Student not found"}), 404
    if request.method == "GET":
        return jsonify({
            "id": student.id,
            "username": student.username,
            "dept_id": student.dept_id,
            "year": student.year,
            "section_id": student.section_id
        }), 200
    elif request.method == "PUT":
        try:
            data = request.json or {}
            if 'username' in data:
                student.username = (data['username'] or "").strip()
            if 'dept_id' in data:
                student.dept_id = data['dept_id']
            if 'year' in data:
                student.year = data['year']
            if 'section_id' in data:
                student.section_id = data['section_id']
            if 'password' in data and data['password']:
                student.set_password(data['password'])
            db.session.commit()
            export_csvs()
            return jsonify({"message": f"Student {student.username} updated successfully."}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to update student: {str(e)}"}), 500
    else:
        try:
            db.session.delete(student)
            db.session.commit()
            export_csvs()
            return jsonify({"message": f"Student {student.username} deleted successfully."}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to delete student: {str(e)}"}), 500

@app.route("/admin/students/delete_bulk", methods=["POST"])
@token_required
@admin_required
def admin_delete_bulk_students(current_user):
    try:
        data = request.json or {}
        ids = data.get('student_ids')
        if not isinstance(ids, list):
            return jsonify({"error": "A list of 'student_ids' is required"}), 400
        if not ids:
            return jsonify({"message": "No student IDs provided."}), 200
        num_deleted = User.query.filter(User.id.in_(ids), User.role == 'student').delete(synchronize_session=False)
        db.session.commit()
        export_csvs()
        return jsonify({"message": f"Successfully deleted {num_deleted} students."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete students in bulk: {str(e)}"}), 500

# Upload additional CSVs
@app.route("/upload/faculty", methods=["POST"])
@token_required
@admin_required
def upload_faculty(current_user):
    try:
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400
        df = pd.read_csv(file)
        required_cols = ['faculty_name', 'dept_name']
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            return jsonify({"error": f"CSV must contain columns: {', '.join(missing_cols)}"}), 400
        added = 0
        for _, row in df.iterrows():
            fname = str(row['faculty_name']).strip() if pd.notna(row['faculty_name']) else ""
            dname = str(row['dept_name']).strip() if pd.notna(row['dept_name']) else ""
            if not fname or not dname:
                continue
            if Faculty.query.filter_by(faculty_name=fname).first():
                continue
            dept = Department.query.filter_by(dept_name=dname).first()
            if not dept:
                continue
            db.session.add(Faculty(faculty_name=fname, max_hours=int(row.get('max_hours', 12)) if pd.notna(row.get('max_hours', 12)) else 12, dept_id=dept.id))
            added += 1
        if added:
            db.session.commit()
            export_csvs()
        return jsonify({"message": f"Faculty uploaded successfully. Added {added} new faculty members."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to upload faculty: {str(e)}"}), 500

@app.route("/upload/students", methods=["POST"])
@token_required
@admin_required
def upload_students(current_user):
    try:
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400
        df = pd.read_csv(file)
        required_cols = ['username', 'password', 'dept_name', 'year', 'section_name']
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            return jsonify({"error": f"CSV must contain columns: {', '.join(missing_cols)}"}), 400
        added = 0
        for _, row in df.iterrows():
            username = str(row['username']).strip() if pd.notna(row['username']) else ""
            password = str(row['password']).strip() if pd.notna(row['password']) else ""
            dept_name = str(row['dept_name']).strip() if pd.notna(row['dept_name']) else ""
            year = int(row['year']) if pd.notna(row['year']) else None
            section_name = str(row['section_name']).strip().upper() if pd.notna(row['section_name']) else ""
            if not all([username, password, dept_name, year, section_name]):
                continue
            if User.query.filter_by(username=username).first():
                continue
            dept = Department.query.filter_by(dept_name=dept_name).first()
            if not dept:
                continue
            section = Section.query.filter_by(name=section_name, year=year, dept_id=dept.id).first()
            if not section:
                continue
            user = User(username=username, role='student', dept_id=dept.id, year=year, section_id=section.id)
            user.set_password(password)
            db.session.add(user)
            added += 1
        if added:
            db.session.commit()
            export_csvs()
        return jsonify({"message": f"Students uploaded. Added {added} new students."}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to upload students: {str(e)}"}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(400)
def bad_request(error):
    return jsonify({"error": "Bad request"}), 400

# ---------- AUTH ROUTES ----------
@app.route("/register", methods=["POST"])

def register():

    if request.method != "POST":
        return jsonify({"message": "Use POST with JSON: username, password, role (student/teacher/admin), optional dept_id/year/section_id"}), 200 


    data = request.json

    print("data from endpoint is: " , data.get("username") , data.get("password") )

    username = data.get("username")
    password = data.get("password")
    role = data.get("role")
    dept_id = data.get("dept_id")
    year = data.get("year")
    section_id = data.get("section_id")

    if not username or not password or role not in ["student", "teacher", "admin"]:
        return jsonify({"error": "Invalid data"}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username exists"}), 400

    # unpack dict into model
    user_data = {
        "username": username,
        "role": role,
        "dept_id": dept_id,
        "year": year,
        "section_id": section_id
    }
    user = User(**user_data)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()
    return jsonify({"message": f"{role.capitalize()} registered successfully"}), 201


# (Removed outdated commented duplicate register implementation)

@app.route("/login", methods=["POST"])
def login():
    try:
        if request.method != "POST":
            return jsonify({"message": "Use POST with JSON: username, password"}), 200
        data = request.json
        username = data.get("username")
        password = data.get("password")
        
        user = User.query.filter_by(username=username, is_active=True).first()
        if user and user.check_password(password):
            token = jwt.encode({
                "user_id": user.id,
                "exp": datetime.utcnow() + timedelta(hours=8)
            }, app.config["SECRET_KEY"], algorithm="HS256")
            
            return jsonify({
                "token": token,
                "role": user.role,
                "user_id": user.id,
                "full_name": user.full_name,
                "department": user.department.dept_name if user.department else None
            }), 200
        
        return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# -----------------------
# ADMIN LOGIN ROUTE
# -----------------------
@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    try:
        if request.method != "POST":
            return jsonify({"message": "Use POST with JSON: username, password (admin credentials)"}), 200
        data = request.json or {}
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"error": "Username and password required"}), 400

        user = User.query.filter_by(username=username, role="admin", is_active=True).first()

        if not user or not user.check_password(password):
            # Avoid user enumeration
            return jsonify({"error": "Invalid admin credentials"}), 401

        token = jwt.encode(
            {
                "user_id": user.id,
                "role": user.role,
                "exp": datetime.utcnow() + timedelta(hours=8)
            },
            app.config["SECRET_KEY"],
            algorithm="HS256"
        )

        return jsonify({
            "message": "Admin login successful",
            "token": token,
            "role": user.role,
            "user_id": user.id
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- ROOM OCCUPANCY ROUTES ----------
@app.route("/teacher/mark_room", methods=["GET", "POST"])
@token_required
def mark_room(current_user):
    if request.method != "POST":
        return jsonify({"message": "Use POST with JSON: room_id, status ('free'|'occupied'), notes (optional)"}), 200
    if current_user.role != "teacher":
        return jsonify({"error": "Unauthorized - Teachers only"}), 403
    
    try:
        data = request.json
        room_id = data.get("room_id")
        status = data.get("status")
        notes = data.get("notes", "")
        
        if status not in ["free", "occupied"]:
            return jsonify({"error": "Invalid status. Must be 'free' or 'occupied'"}), 400

        room = Classroom.query.get(room_id)
        if not room:
            return jsonify({"error": "Room not found"}), 404

        occupancy = RoomOccupancy(
            room_id=room_id,
            user_id=current_user.id,
            status=status,
            notes=notes
        )
        db.session.add(occupancy)
        db.session.commit()
        
        # Auto-export CSVs after successful save
        export_csvs()
        
        return jsonify({"message": f"Room {room.name} marked as {status}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/rooms/status", methods=["GET"])
@token_required
def get_rooms_status(current_user):
    try:
        all_rooms = Classroom.query.all()
        free_rooms, unmarked_rooms, occupied_rooms = [], [], []
        
        for room in all_rooms:
            # Get latest occupancy status for this room
            occupancy = RoomOccupancy.query.filter_by(room_id=room.room_id)\
                            .order_by(RoomOccupancy.timestamp.desc()).first()
            
            room_info = {
                "room_id": room.room_id,
                "room_name": room.name,
                "capacity": room.capacity,
                "resources": room.resources
            }
            
            if not occupancy:
                room_info["status"] = "unmarked"
                unmarked_rooms.append(room_info)
            elif occupancy.status == "free":
                room_info.update({
                    "status": "free",
                    "last_updated": occupancy.timestamp.isoformat(),
                    "updated_by": occupancy.user.full_name if occupancy.user else "Unknown"
                })
                free_rooms.append(room_info)
            else:
                room_info.update({
                    "status": "occupied",
                    "last_updated": occupancy.timestamp.isoformat(),
                    "updated_by": occupancy.user.full_name if occupancy.user else "Unknown",
                    "notes": occupancy.notes
                })
                occupied_rooms.append(room_info)
        
        return jsonify({
            "free_rooms": free_rooms,
            "unmarked_rooms": unmarked_rooms,
            "occupied_rooms": occupied_rooms,
            "total_rooms": len(all_rooms)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------- PERSONALIZED TIMETABLE ROUTES ----------
@app.route("/teacher/timetable", methods=["GET"])
@token_required
def teacher_timetable(current_user):
    if current_user.role != "teacher":
        return jsonify({"error": "Unauthorized - Teachers only"}), 403
    
    try:
        # Find faculty record for this user
        faculty = Faculty.query.filter_by(faculty_name=current_user.full_name, dept_id=current_user.dept_id).first()
        if not faculty:
            return jsonify({"error": "Faculty record not found"}), 404
        
        timetable_entries = Timetable.query.filter_by(faculty_id=faculty.faculty_id).all()
        result = [{
            "course": e.course.name,
            "section": f"{e.section.name} (Year {e.section.year})",
            "room": e.room.name,
            "day": e.day,
            "slot": e.slot,
            "department": e.course.department.dept_name
        } for e in timetable_entries]
        
        return jsonify({
            "timetable": result,
            "teacher_name": current_user.full_name,
            "department": current_user.department.dept_name if current_user.department else None
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/student/timetable", methods=["GET"])
@token_required
def student_timetable(current_user):
    if current_user.role != "student":
        return jsonify({"error": "Unauthorized - Students only"}), 403
    
    try:
        if not current_user.section_id:
            return jsonify({"error": "Section not assigned"}), 400
        
        timetable_entries = Timetable.query.filter_by(section_id=current_user.section_id).all()
        result = [{
            "course": e.course.name,
            "faculty": e.faculty.faculty_name,
            "room": e.room.name,
            "day": e.day,
            "slot": e.slot,
            "type": e.course.type,
            "credits": e.course.credits
        } for e in timetable_entries]
        
        return jsonify({
            "timetable": result,
            "student_name": current_user.full_name,
            "section": current_user.section.name if current_user.section else None,
            "year": current_user.year,
            "department": current_user.department.dept_name if current_user.department else None
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    # --- NEW FACULTY UNAVAILABILITY ROUTES ---
@app.route("/admin/faculty/<int:faculty_id>/unavailability", methods=["GET", "POST"])
@token_required
@admin_required
def manage_faculty_unavailability(current_user, faculty_id):
    """
    Handles getting and adding unavailability slots for a specific faculty member.
    """
    # Find the faculty or return a 404 error if not found
    faculty = Faculty.query.get_or_404(faculty_id)

    if request.method == "GET":
        try:
            # Query all unavailability records for this faculty
            slots = FacultyUnavailability.query.filter_by(faculty_id=faculty.faculty_id).all()
            # Return the list of slots as JSON
            return jsonify([
                {"id": s.id, "day": s.day, "slot": s.slot} for s in slots
            ])
        except Exception as e:
            return jsonify({"error": f"Failed to fetch unavailable slots: {str(e)}"}), 500

    if request.method == "POST":
        try:
            data = request.json
            # Validate that the request body contains the required fields
            if not data or not data.get("day") or not data.get("slot"):
                return jsonify({"error": "Day and slot are required"}), 400

            day = data["day"]
            slot = data["slot"]

            # Prevent duplicate entries for the same faculty, day, and slot
            existing = FacultyUnavailability.query.filter_by(
                faculty_id=faculty.faculty_id,
                day=day,
                slot=slot
            ).first()
            if existing:
                return jsonify({"error": "This unavailability slot already exists for this faculty."}), 400

            # Create the new unavailability record
            new_slot = FacultyUnavailability(
                faculty_id=faculty.faculty_id,
                day=day,
                slot=slot
            )
            db.session.add(new_slot)
            db.session.commit()
            
            # Return a success message and the data for the new slot
            return jsonify({
                "message": f"Unavailability added for {faculty.faculty_name}",
                "slot": {"id": new_slot.id, "day": new_slot.day, "slot": new_slot.slot}
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to add unavailability: {str(e)}"}), 500


@app.route("/admin/unavailability/<int:slot_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_unavailability(current_user, slot_id):
    """
    Handles deleting a specific unavailability slot by its ID.
    """
    # Find the specific unavailability slot or return a 404 error
    slot = FacultyUnavailability.query.get_or_404(slot_id)
    try:
        # Delete the record from the database
        db.session.delete(slot)
        db.session.commit()
        return jsonify({"message": "Unavailability slot deleted successfully."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete slot: {str(e)}"}), 500



# ---------- CSV UPLOAD ROUTES ----------
@app.route("/upload/departments", methods=["GET", "POST"])
@token_required
def upload_departments(current_user):
    if request.method != "POST":
        return jsonify({"message": "Use POST with form-data 'file' (CSV)"}), 200
    if current_user.role != "admin":
        return jsonify({"error": "Unauthorized - admin only"}), 403 #admin only should upload csv
    
    try:
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400
        
        df = pd.read_csv(file)
        added_count = 0
        for _, row in df.iterrows():
            if not Department.query.filter_by(dept_name=row['dept_name']).first():
                dept = Department(dept_name=row['dept_name'])
                db.session.add(dept)
                added_count += 1
        
        db.session.commit()
        return jsonify({"message": f"{added_count} departments uploaded successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/upload/sections", methods=["GET", "POST"])
@token_required
def upload_sections(current_user):
    if request.method != "POST":
        return jsonify({"message": "Use POST with form-data 'file' (CSV)"}), 200
    if current_user.role != "teacher":
        return jsonify({"error": "Unauthorized - Teachers only"}), 403
    
    try:
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400
        
        df = pd.read_csv(file)
        added_count = 0
        for _, row in df.iterrows():
            dept = Department.query.filter_by(dept_name=row['dept_name']).first()
            if dept and not Section.query.filter_by(
                name=row['name'], year=row['year'], dept_id=dept.id
            ).first():
                section = Section(name=row['name'], year=row['year'], dept_id=dept.id)
                db.session.add(section)
                added_count += 1
        
        db.session.commit()
        return jsonify({"message": f"{added_count} sections uploaded successfully"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------- EXISTING ROUTES (ENHANCED) ----------
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Enhanced Timetable Management System API",
        "status": "running",
        "features": [
            "User Authentication (JWT)",
            "Role-based Access (Teacher/Student)",
            "Room Occupancy Tracking",
            "Section-based Timetables",
            "Personalized Views",
            "CSV Upload Support"
        ],
        "endpoints": [
            "/register", "/login",
            "/teacher/mark_room", "/rooms/status",
            "/teacher/timetable", "/student/timetable",
            "/upload/departments", "/upload/sections",
            "/get_departments", "/add_department",
            "/get_faculty", "/add_faculty", 
            "/get_courses", "/add_course",
            "/get_sections", "/add_section",
            "/get_rooms", "/add_room",
            "/get_timetable", "/generate_timetable",
            "/generate_csvs"
        ]
    })

# Basic CRUD operations (keeping existing functionality)
@app.route("/add_department", methods=["GET", "POST"])
def add_department():
    try:
        if request.method != "POST":
            return jsonify({"message": "Use POST with JSON: dept_name"}), 200
        data = request.json
        if not data or not data.get("dept_name"):
            return jsonify({"error": "Department name is required"}), 400
            
        existing = Department.query.filter_by(dept_name=data["dept_name"]).first()
        if existing:
            return jsonify({"error": "Department already exists"}), 400
            
        dept = Department(dept_name=data["dept_name"])
        db.session.add(dept)
        db.session.commit()
        
        # Auto-export CSVs after successful save
        export_csvs()
        
        return jsonify({"message": "Department added", "dept_name": dept.dept_name}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_departments", methods=["GET"])
def get_departments():
    try:
        depts = Department.query.all()
        return jsonify([{"id": d.id, "dept_name": d.dept_name} for d in depts])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/add_section", methods=["GET", "POST"])
def add_section():
    try:
        if request.method != "POST":
            return jsonify({"message": "Use POST with JSON: name, year, dept_name"}), 200
        data = request.json
        required_fields = ["name", "year", "dept_name"]
        if not all(data.get(field) for field in required_fields):
            return jsonify({"error": "Name, year, and department are required"}), 400
            
        dept = Department.query.filter_by(dept_name=data["dept_name"]).first()
        if not dept:
            return jsonify({"error": "Department not found"}), 404
            
        existing = Section.query.filter_by(
            name=data["name"], year=data["year"], dept_id=dept.id
        ).first()
        if existing:
            return jsonify({"error": "Section already exists"}), 400
            
        section = Section(name=data["name"], year=data["year"], dept_id=dept.id)
        db.session.add(section)
        db.session.commit()
        
        # Auto-export CSVs after successful save
        export_csvs()
        
        return jsonify({"message": "Section added", "section_id": section.id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_sections", methods=["GET"])
def get_sections():
    try:
        dept_name = request.args.get("dept_name")
        year = request.args.get("year")
        
        query = Section.query
        if dept_name:
            dept = Department.query.filter_by(dept_name=dept_name).first()
            if dept:
                query = query.filter_by(dept_id=dept.id)
        if year:
            query = query.filter_by(year=int(year))
            
        sections = query.all()
        return jsonify([{
            "id": s.id,
            "name": s.name,
            "year": s.year,
            "dept_name": s.department.dept_name,
            "student_count": len(s.users)
        } for s in sections])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/add_faculty", methods=["GET", "POST"])
def add_faculty():
    try:
        if request.method != "POST":
            return jsonify({"message": "Use POST with JSON: faculty_name, dept_name, max_hours (optional)"}), 200
        data = request.json
        if not data or not data.get("faculty_name") or not data.get("dept_name"):
            return jsonify({"error": "Faculty name and department are required"}), 400
            
        dept = Department.query.filter_by(dept_name=data["dept_name"]).first()
        if not dept:
            return jsonify({"error": "Department not found"}), 404
            
        faculty = Faculty(
            faculty_name=data["faculty_name"],
            max_hours=data.get("max_hours", 12),
            dept_id=dept.id
        )
        db.session.add(faculty)
        db.session.commit()
        
        # Auto-export CSVs after successful save
        export_csvs()
        
        return jsonify({"message": "Faculty added successfully!", "faculty_id": faculty.faculty_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_faculty", methods=["GET"])
def get_faculty():
    try:
        faculty = Faculty.query.all()
        return jsonify([
            {
                "id": f.faculty_id,
                "name": f.faculty_name,
                "dept_name": f.department.dept_name,
                "max_hours": f.max_hours
            }
            for f in faculty
        ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/add_course", methods=["GET", "POST"])
def add_course():
    try:
        if request.method != "POST":
            return jsonify({"message": "Use POST with JSON: name, type, dept_name, faculty_id, year, semester, credits (optional)"}), 200
        data = request.json
        required_fields = ["name", "type", "dept_name", "faculty_id", "year", "semester"]
        if not data or not all(data.get(field) is not None for field in required_fields):
            return jsonify({"error": "Name, type, department, faculty, year, and semester are required"}), 400
            
        dept = Department.query.filter_by(dept_name=data["dept_name"]).first()
        if not dept:
            return jsonify({"error": "Department not found"}), 404
            
        faculty = Faculty.query.get(data["faculty_id"])
        if not faculty:
            return jsonify({"error": "Faculty not found"}), 404
            
        # Check course allocation limits
        allocation = CourseAllocation.query.filter_by(
            dept_id=dept.id,
            year=data["year"],
            semester=data["semester"]
        ).first()
        
        if allocation:
            current_courses = Course.query.filter_by(
                dept_id=dept.id,
                year=data["year"],
                semester=data["semester"]
            ).count()
            
            if current_courses >= allocation.total_courses:
                return jsonify({
                    "error": f"Maximum courses ({allocation.total_courses}) already allocated for {dept.dept_name} Year {data['year']} Semester {data['semester']}"
                }), 400
            
        course = Course(
            name=data["name"],
            type=data["type"],
             #credits=data.get("credits", 0),
            year=data["year"],
            semester=data["semester"],
            dept_id=dept.id,
            faculty_id=data["faculty_id"]
        )
        db.session.add(course)
        db.session.commit()
        
        # Auto-export CSVs after successful save
        export_csvs()
        
        return jsonify({"message": "Course added", "course_id": course.course_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_courses", methods=["GET"])
def get_courses():
    try:
        dept_name = request.args.get("dept_name")
        year = request.args.get("year")
        
        query = Course.query
        if dept_name:
            dept = Department.query.filter_by(dept_name=dept_name).first()
            if dept:
                query = query.filter_by(dept_id=dept.id)
        if year:
            query = query.filter_by(year=int(year))
            
        courses = query.all()
        return jsonify([
            {
                "id": c.course_id,
                "name": c.name,
                "type": c.type,
                # "credits": c.credits,
                "year": c.year,
                "semester": c.semester,
                "dept_name": c.department.dept_name,
                "faculty_id": c.faculty_id,
                "faculty_name": Faculty.query.get(c.faculty_id).faculty_name if Faculty.query.get(c.faculty_id) else "Unknown"
            }
            for c in courses
        ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/add_room", methods=["GET", "POST"])
def add_room():
    try:
        if request.method != "POST":
            return jsonify({"message": "Use POST with JSON: name, capacity, resources (optional)"}), 200
        data = request.json
        if not data or not data.get("name") or not data.get("capacity"):
            return jsonify({"error": "Room name and capacity are required"}), 400
            
        room = Classroom(
            name=data["name"],
            capacity=data["capacity"],
            resources=data.get("resources", "")
        )
        db.session.add(room)
        db.session.commit()
        
        # Auto-export CSVs after successful save
        export_csvs()
        
        return jsonify({"message": "Room added", "room_id": room.room_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_rooms", methods=["GET"])
def get_rooms():
    try:
        rooms = Classroom.query.all()
        return jsonify([
            {
                "id": r.room_id,
                "name": r.name,
                "capacity": r.capacity,
                "resources": r.resources
            }
            for r in rooms
        ])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/set_course_allocation", methods=["GET", "POST"])
def set_course_allocation():
    try:
        if request.method != "POST":
            return jsonify({"message": "Use POST with JSON: dept_name, year, semester, total_courses"}), 200
        data = request.json
        required_fields = ["dept_name", "year", "semester", "total_courses"]
        if not all(data.get(field) is not None for field in required_fields):
            return jsonify({"error": "Department, year, semester, and total courses are required"}), 400
            
        dept = Department.query.filter_by(dept_name=data["dept_name"]).first()
        if not dept:
            return jsonify({"error": "Department not found"}), 404
            
        # Check if allocation already exists
        existing = CourseAllocation.query.filter_by(
            dept_id=dept.id,
            year=data["year"],
            semester=data["semester"]
        ).first()
        
        if existing:
            existing.total_courses = data["total_courses"]
        else:
            allocation = CourseAllocation(
                dept_id=dept.id,
                year=data["year"],
                semester=data["semester"],
                total_courses=data["total_courses"],
                allocated_courses=0
            )
            db.session.add(allocation)
            
        db.session.commit()
        
        # Auto-export CSVs after successful save
        export_csvs()
        
        return jsonify({"message": "Course allocation set successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_course_allocations", methods=["GET"])
def get_course_allocations():
    try:
        dept_name = request.args.get("dept_name")
        year = request.args.get("year")
        
        query = CourseAllocation.query
        if dept_name:
            dept = Department.query.filter_by(dept_name=dept_name).first()
            if dept:
                query = query.filter_by(dept_id=dept.id)
        if year:
            query = query.filter_by(year=int(year))
            
        allocations = query.all()
        result = []
        for allocation in allocations:
            actual_courses = Course.query.filter_by(
                dept_id=allocation.dept_id,
                year=allocation.year,
                semester=allocation.semester
            ).count()
            
            result.append({
                "id": allocation.id,
                "dept_name": allocation.department.dept_name,
                "year": allocation.year,
                "semester": allocation.semester,
                "total_courses": allocation.total_courses,
                "allocated_courses": actual_courses,
                "remaining_courses": allocation.total_courses - actual_courses
            })
            
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/generate_timetable", methods=["GET", "POST"])
def generate_timetable():
    try:
        if request.method != "POST":
            return jsonify({"message": "Use POST (no body) to generate timetable"}), 200
        result = generate_timetable_internal()
        if "error" in result:
            return jsonify(result), 400
            
        # Get the enhanced timetable data
        timetable = Timetable.query.all()
        result_data = []
        
        for t in timetable:
            result_data.append({
                "course": t.course.name,
                "section": f"{t.section.name} (Year {t.section.year})",
                "faculty": t.faculty.faculty_name,
                "room": t.room.name,
                "day": t.day,
                "slot": t.slot,
                "department": t.course.department.dept_name,
                "year": t.section.year,
                "credits": t.course.credits
            })
            
        return jsonify({"message": "Enhanced timetable generated", "timetable": result_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/get_timetable", methods=["GET"])
def get_timetable():
    try:
        dept_name = request.args.get("dept_name")
        year = request.args.get("year")
        section_name = request.args.get("section")
        
        query = Timetable.query
        
        # Apply filters
        if dept_name or year or section_name:
            timetable = []
            for t in Timetable.query.all():
                include = True
                
                if dept_name and t.course.department.dept_name != dept_name:
                    include = False
                if year and t.section.year != int(year):
                    include = False
                if section_name and t.section.name != section_name:
                    include = False
                    
                if include:
                    timetable.append(t)
        else:
            timetable = Timetable.query.all()
        
        result = []
        for t in timetable:
            result.append({
                "id": t.timetable_id,
                "course": t.course.name,
                "section": f"{t.section.name} (Year {t.section.year})",
                "faculty": t.faculty.faculty_name,
                "room": t.room.name,
                "day": t.day,
                "slot": t.slot,
                "department": t.course.department.dept_name,
                "year": t.section.year,
                "credits": t.course.credits,
                "type": t.course.type
            })
            
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# ---------- HELPER FUNCTION FOR SWAP CONFLICTS (NEW) ----------

def check_for_conflict(timetable_entry_to_move, new_day, new_slot):
    """
    Checks if moving a timetable entry to a new day/slot would cause a conflict.
    Returns an error message string if a conflict exists, otherwise returns None.
    """
    # 1. Check for Faculty Conflict: Is the teacher already busy at the new time?
    faculty_conflict = Timetable.query.filter(
        Timetable.faculty_id == timetable_entry_to_move.faculty_id,
        Timetable.day == new_day,
        Timetable.slot == new_slot,
        Timetable.timetable_id != timetable_entry_to_move.timetable_id # Exclude the entry we are moving
    ).first()
    if faculty_conflict:
        return f"Faculty is already assigned to '{faculty_conflict.course.name}' at that time."

    # 2. Check for Section Conflict: Is the section already in a class at the new time?
    section_conflict = Timetable.query.filter(
        Timetable.section_id == timetable_entry_to_move.section_id,
        Timetable.day == new_day,
        Timetable.slot == new_slot,
        Timetable.timetable_id != timetable_entry_to_move.timetable_id
    ).first()
    if section_conflict:
        return f"Section is already scheduled for '{section_conflict.course.name}' at that time."

    # 3. Check for Room Conflict: Is the room already booked at the new time?
    room_conflict = Timetable.query.filter(
        Timetable.room_id == timetable_entry_to_move.room_id,
        Timetable.day == new_day,
        Timetable.slot == new_slot,
        Timetable.timetable_id != timetable_entry_to_move.timetable_id
    ).first()
    if room_conflict:
        return f"Room '{timetable_entry_to_move.room.name}' is already booked at that time."
        
    return None # No conflicts found


# ---------- SWAP REQUEST ROUTES (NEW) ----------

@app.route("/teacher/swap-requests", methods=["GET", "POST"])
@token_required
@teacher_required
def teacher_swap_requests(current_user):
    # Find the faculty record linked to the logged-in teacher user
    faculty = Faculty.query.filter_by(faculty_name=current_user.full_name).first() # Assumes full_name matches faculty_name
    if not faculty:
        return jsonify({"error": "Faculty record for the current user not found."}), 404

    if request.method == "POST":
        data = request.json
        required = ["original_timetable_id", "proposed_day", "proposed_slot", "reason"]
        if not all(key in data for key in required):
            return jsonify({"error": f"Missing required fields: {', '.join(required)}"}), 400
        
        # Verify the teacher owns the class they are trying to move
        timetable_entry = Timetable.query.get(data['original_timetable_id'])
        if not timetable_entry or timetable_entry.faculty_id != faculty.faculty_id:
            return jsonify({"error": "You can only request to move your own classes."}), 403

        new_request = SwapRequest(
            requesting_faculty_id=faculty.faculty_id,
            original_timetable_id=data['original_timetable_id'],
            proposed_day=data['proposed_day'],
            proposed_slot=data['proposed_slot'],
            reason=data['reason']
        )
        db.session.add(new_request)
        db.session.commit()
        return jsonify({"message": "Swap request submitted successfully."}), 201

    if request.method == "GET":
        requests = SwapRequest.query.filter_by(requesting_faculty_id=faculty.faculty_id).all()
        return jsonify([{
            "id": r.id,
            "course_name": r.original_timetable_entry.course.name,
            "original_day": r.original_timetable_entry.day,
            "original_slot": r.original_timetable_entry.slot,
            "proposed_day": r.proposed_day,
            "proposed_slot": r.proposed_slot,
            "status": r.status,
            "reason": r.reason,
            "created_at": r.created_at.isoformat()
        } for r in requests])


@app.route("/admin/swap-requests", methods=["GET"])
@token_required
@admin_required
def admin_get_swap_requests(current_user):
    status_filter = request.args.get('status', 'pending') # Default to pending requests
    requests = SwapRequest.query.filter_by(status=status_filter).all()
    
    return jsonify([{
        "id": r.id,
        "requesting_faculty": r.requesting_faculty.faculty_name,
        "course_name": r.original_timetable_entry.course.name,
        "section_name": r.original_timetable_entry.section.name,
        "original_day": r.original_timetable_entry.day,
        "original_slot": r.original_timetable_entry.slot,
        "proposed_day": r.proposed_day,
        "proposed_slot": r.proposed_slot,
        "status": r.status,
        "reason": r.reason,
        "created_at": r.created_at.isoformat()
    } for r in requests])


@app.route("/admin/swap-requests/<int:request_id>/approve", methods=["POST"])
@token_required
@admin_required
def admin_approve_swap(current_user, request_id):
    swap_request = SwapRequest.query.get_or_404(request_id)
    if swap_request.status != 'pending':
        return jsonify({"error": f"This request has already been {swap_request.status}."}), 400

    timetable_entry = swap_request.original_timetable_entry
    
    # Check for conflicts before approving
    conflict_reason = check_for_conflict(timetable_entry, swap_request.proposed_day, swap_request.proposed_slot)
    if conflict_reason:
        return jsonify({"error": f"Approval failed. Conflict found: {conflict_reason}"}), 409 # 409 Conflict

    # No conflicts, so update the timetable
    timetable_entry.day = swap_request.proposed_day
    timetable_entry.slot = swap_request.proposed_slot
    
    # Update the request status
    swap_request.status = 'approved'
    swap_request.admin_notes = f"Approved by {current_user.username}."
    
    db.session.commit()
    
    # Optional: Send a notification email to the teacher here
    
    return jsonify({"message": "Swap request approved and timetable updated."})


@app.route("/admin/swap-requests/<int:request_id>/reject", methods=["POST"])
@token_required
@admin_required
def admin_reject_swap(current_user, request_id): 
    swap_request = SwapRequest.query.get_or_404(request_id)
    if swap_request.status != 'pending':
        return jsonify({"error": f"This request has already been {swap_request.status}."}), 400

    data = request.json
    rejection_reason = data.get('reason', 'No reason provided.') if data else 'No reason provided.'

    swap_request.status = 'rejected'
    swap_request.admin_notes = f"Rejected by {current_user.username}. Reason: {rejection_reason}"
    
    db.session.commit()

    # Optional: Send a notification email to the teacher here
    
    return jsonify({"message": "Swap request has been rejected."})

@app.route("/generate_csvs", methods=["GET", "POST"])
def generate_csvs():
    try:
        if request.method != "POST":
            return jsonify({"message": "Use POST (no body) to export CSVs"}), 200
        
        success = export_csvs()
        if success:
            return jsonify({"message": "Enhanced CSV files generated successfully"}), 200
        else:
            return jsonify({"error": "CSV export failed"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ========== LEAVE REQUEST SYSTEM ==========

# Teacher/Student Leave Request Endpoints
@app.route("/leave/request", methods=["POST"])
@token_required
def submit_leave_request(current_user):
    """Submit a new leave request"""
    try:
        data = request.json
        required_fields = ["leave_type", "start_date", "end_date", "reason"]
        
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields: leave_type, start_date, end_date, reason"}), 400
        
        # Validate leave type
        valid_types = ["sick", "vacation", "personal", "emergency", "medical", "family"]
        if data["leave_type"] not in valid_types:
            return jsonify({"error": f"Invalid leave type. Must be one of: {', '.join(valid_types)}"}), 400
        
        # Validate dates
        try:
            start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
            end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
        
        if start_date > end_date:
            return jsonify({"error": "Start date cannot be after end date"}), 400
        
        # Check if start date is not in the past
        if start_date < datetime.now().date():
            return jsonify({"error": "Cannot request leave for past dates"}), 400
        
        # Check for overlapping leave requests
        overlapping = LeaveRequest.query.filter(
            LeaveRequest.user_id == current_user.id,
            LeaveRequest.status.in_(["pending", "approved"]),
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date
        ).first()
        
        if overlapping:
            return jsonify({"error": "You already have a leave request for overlapping dates"}), 400
        
        leave_request = LeaveRequest(
            user_id=current_user.id,
            leave_type=data["leave_type"],
            start_date=start_date,
            end_date=end_date,
            reason=data["reason"]
        )
        
        db.session.add(leave_request)
        db.session.commit()
        
        return jsonify({
            "message": "Leave request submitted successfully",
            "request_id": leave_request.id,
            "status": "pending"
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to submit leave request: {str(e)}"}), 500

@app.route("/leave/my-requests", methods=["GET"])
@token_required
def get_my_leave_requests(current_user):
    """Get all leave requests for the current user"""
    try:
        status_filter = request.args.get("status")  # optional filter
        query = LeaveRequest.query.filter_by(user_id=current_user.id)
        
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        requests = query.order_by(LeaveRequest.created_at.desc()).all()
        
        return jsonify([{
            "id": req.id,
            "leave_type": req.leave_type,
            "start_date": req.start_date.isoformat(),
            "end_date": req.end_date.isoformat(),
            "reason": req.reason,
            "status": req.status,
            "admin_notes": req.admin_notes,
            "created_at": req.created_at.isoformat(),
            "updated_at": req.updated_at.isoformat(),
            "days_requested": (req.end_date - req.start_date).days + 1
        } for req in requests])
    except Exception as e:
        return jsonify({"error": f"Failed to fetch leave requests: {str(e)}"}), 500

@app.route("/leave/request/<int:request_id>", methods=["GET"])
@token_required
def get_leave_request_details(current_user, request_id):
    """Get details of a specific leave request"""
    try:
        leave_request = LeaveRequest.query.filter_by(id=request_id, user_id=current_user.id).first()
        if not leave_request:
            return jsonify({"error": "Leave request not found"}), 404
        
        return jsonify({
            "id": leave_request.id,
            "leave_type": leave_request.leave_type,
            "start_date": leave_request.start_date.isoformat(),
            "end_date": leave_request.end_date.isoformat(),
            "reason": leave_request.reason,
            "status": leave_request.status,
            "admin_notes": leave_request.admin_notes,
            "created_at": leave_request.created_at.isoformat(),
            "updated_at": leave_request.updated_at.isoformat(),
            "days_requested": (leave_request.end_date - leave_request.start_date).days + 1,
            "approver": leave_request.approver.username if leave_request.approver else None
        })
    except Exception as e:
        return jsonify({"error": f"Failed to fetch leave request: {str(e)}"}), 500

@app.route("/leave/request/<int:request_id>", methods=["PUT"])
@token_required
def update_leave_request(current_user, request_id):
    """Update a pending leave request"""
    try:
        leave_request = LeaveRequest.query.filter_by(id=request_id, user_id=current_user.id).first()
        if not leave_request:
            return jsonify({"error": "Leave request not found"}), 404
        
        if leave_request.status != "pending":
            return jsonify({"error": "Cannot modify approved/rejected request"}), 400
        
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Validate dates if provided
        if "start_date" in data:
            try:
                new_start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
                if new_start_date < datetime.now().date():
                    return jsonify({"error": "Cannot set start date in the past"}), 400
                leave_request.start_date = new_start_date
            except ValueError:
                return jsonify({"error": "Invalid start_date format. Use YYYY-MM-DD"}), 400
        
        if "end_date" in data:
            try:
                new_end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
                if new_end_date < leave_request.start_date:
                    return jsonify({"error": "End date cannot be before start date"}), 400
                leave_request.end_date = new_end_date
            except ValueError:
                return jsonify({"error": "Invalid end_date format. Use YYYY-MM-DD"}), 400
        
        if "reason" in data:
            leave_request.reason = data["reason"]
        
        if "leave_type" in data:
            valid_types = ["sick", "vacation", "personal", "emergency", "medical", "family"]
            if data["leave_type"] not in valid_types:
                return jsonify({"error": f"Invalid leave type. Must be one of: {', '.join(valid_types)}"}), 400
            leave_request.leave_type = data["leave_type"]
        
        leave_request.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({"message": "Leave request updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update leave request: {str(e)}"}), 500

@app.route("/leave/request/<int:request_id>", methods=["DELETE"])
@token_required
def cancel_leave_request(current_user, request_id):
    """Cancel a pending leave request"""
    try:
        leave_request = LeaveRequest.query.filter_by(id=request_id, user_id=current_user.id).first()
        if not leave_request:
            return jsonify({"error": "Leave request not found"}), 404
        
        if leave_request.status != "pending":
            return jsonify({"error": "Cannot cancel approved/rejected request"}), 400
        
        db.session.delete(leave_request)
        db.session.commit()
        
        return jsonify({"message": "Leave request cancelled successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to cancel leave request: {str(e)}"}), 500

# ========== ADMIN LEAVE MANAGEMENT ENDPOINTS ==========

@app.route("/admin/leave-requests", methods=["GET"])
@token_required
@admin_required
def admin_get_leave_requests(current_user):
    """Get all leave requests for admin review"""
    try:
        status_filter = request.args.get("status", "pending")  # Default to pending
        dept_filter = request.args.get("department")  # Optional department filter
        leave_type_filter = request.args.get("leave_type")  # Optional leave type filter
        
        query = LeaveRequest.query
        
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        if dept_filter:
            query = query.join(User).join(Department).filter(Department.dept_name == dept_filter)
        
        if leave_type_filter:
            query = query.filter_by(leave_type=leave_type_filter)
        
        requests = query.order_by(LeaveRequest.created_at.desc()).all()
        
        return jsonify([{
            "id": req.id,
            "user_id": req.user_id,
            "username": req.user.username,
            "full_name": req.user.full_name,
            "email": req.user.email,
            "department": req.user.department.dept_name if req.user.department else "N/A",
            "leave_type": req.leave_type,
            "start_date": req.start_date.isoformat(),
            "end_date": req.end_date.isoformat(),
            "reason": req.reason,
            "status": req.status,
            "admin_notes": req.admin_notes,
            "created_at": req.created_at.isoformat(),
            "updated_at": req.updated_at.isoformat(),
            "days_requested": (req.end_date - req.start_date).days + 1,
            "approver": req.approver.username if req.approver else None
        } for req in requests])
    except Exception as e:
        return jsonify({"error": f"Failed to fetch leave requests: {str(e)}"}), 500

@app.route("/admin/leave-requests/<int:request_id>", methods=["GET"])
@token_required
@admin_required
def admin_get_leave_request_details(current_user, request_id):
    """Get detailed information about a specific leave request"""
    try:
        leave_request = LeaveRequest.query.get_or_404(request_id)
        
        return jsonify({
            "id": leave_request.id,
            "user_id": leave_request.user_id,
            "username": leave_request.user.username,
            "full_name": leave_request.user.full_name,
            "email": leave_request.user.email,
            "department": leave_request.user.department.dept_name if leave_request.user.department else "N/A",
            "leave_type": leave_request.leave_type,
            "start_date": leave_request.start_date.isoformat(),
            "end_date": leave_request.end_date.isoformat(),
            "reason": leave_request.reason,
            "status": leave_request.status,
            "admin_notes": leave_request.admin_notes,
            "created_at": leave_request.created_at.isoformat(),
            "updated_at": leave_request.updated_at.isoformat(),
            "days_requested": (leave_request.end_date - leave_request.start_date).days + 1,
            "approver": leave_request.approver.username if leave_request.approver else None
        })
    except Exception as e:
        return jsonify({"error": f"Failed to fetch leave request: {str(e)}"}), 500

@app.route("/admin/leave-requests/<int:request_id>/approve", methods=["POST"])
@token_required
@admin_required
def admin_approve_leave_request(current_user, request_id):
    """Approve a leave request"""
    try:
        leave_request = LeaveRequest.query.get_or_404(request_id)
        
        if leave_request.status != "pending":
            return jsonify({"error": f"Request has already been {leave_request.status}"}), 400
        
        data = request.json or {}
        admin_notes = data.get("admin_notes", "")
        
        leave_request.status = "approved"
        leave_request.approved_by = current_user.id
        leave_request.admin_notes = admin_notes
        leave_request.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "message": "Leave request approved successfully",
            "request_id": request_id,
            "status": "approved"
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to approve leave request: {str(e)}"}), 500

@app.route("/admin/leave-requests/<int:request_id>/reject", methods=["POST"])
@token_required
@admin_required
def admin_reject_leave_request(current_user, request_id):
    """Reject a leave request"""
    try:
        leave_request = LeaveRequest.query.get_or_404(request_id)
        
        if leave_request.status != "pending":
            return jsonify({"error": f"Request has already been {leave_request.status}"}), 400
        
        data = request.json or {}
        admin_notes = data.get("admin_notes", "")
        
        if not admin_notes:
            return jsonify({"error": "Admin notes are required when rejecting a request"}), 400
        
        leave_request.status = "rejected"
        leave_request.approved_by = current_user.id
        leave_request.admin_notes = admin_notes
        leave_request.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "message": "Leave request rejected successfully",
            "request_id": request_id,
            "status": "rejected"
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to reject leave request: {str(e)}"}), 500

@app.route("/admin/leave-requests/stats", methods=["GET"])
@token_required
@admin_required
def admin_get_leave_stats(current_user):
    """Get leave request statistics for admin dashboard"""
    try:
        total_requests = LeaveRequest.query.count()
        pending_requests = LeaveRequest.query.filter_by(status="pending").count()
        approved_requests = LeaveRequest.query.filter_by(status="approved").count()
        rejected_requests = LeaveRequest.query.filter_by(status="rejected").count()
        
        # Get requests by leave type
        leave_type_stats = db.session.query(
            LeaveRequest.leave_type,
            db.func.count(LeaveRequest.id).label('count')
        ).group_by(LeaveRequest.leave_type).all()
        
        # Get requests by department
        dept_stats = db.session.query(
            Department.dept_name,
            db.func.count(LeaveRequest.id).label('count')
        ).join(User).join(Department).group_by(Department.dept_name).all()
        
        return jsonify({
            "total_requests": total_requests,
            "pending_requests": pending_requests,
            "approved_requests": approved_requests,
            "rejected_requests": rejected_requests,
            "leave_type_breakdown": [{"type": stat.leave_type, "count": stat.count} for stat in leave_type_stats],
            "department_breakdown": [{"department": stat.dept_name, "count": stat.count} for stat in dept_stats]
        })
    except Exception as e:
        return jsonify({"error": f"Failed to fetch leave statistics: {str(e)}"}), 500

@app.route("/admin/leave-requests/bulk-action", methods=["POST"])
@token_required
@admin_required
def admin_bulk_leave_action(current_user):
    """Perform bulk actions on leave requests"""
    try:
        data = request.json
        action = data.get("action")  # "approve" or "reject"
        request_ids = data.get("request_ids", [])
        admin_notes = data.get("admin_notes", "")
        
        if action not in ["approve", "reject"]:
            return jsonify({"error": "Invalid action. Must be 'approve' or 'reject'"}), 400
        
        if not request_ids:
            return jsonify({"error": "No request IDs provided"}), 400
        
        if action == "reject" and not admin_notes:
            return jsonify({"error": "Admin notes are required for rejection"}), 400
        
        # Get all pending requests with the provided IDs
        requests = LeaveRequest.query.filter(
            LeaveRequest.id.in_(request_ids),
            LeaveRequest.status == "pending"
        ).all()
        
        if not requests:
            return jsonify({"error": "No pending requests found with the provided IDs"}), 404
        
        # Update all requests
        for req in requests:
            req.status = action + "d"
            req.approved_by = current_user.id
            req.admin_notes = admin_notes
            req.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "message": f"Successfully {action}d {len(requests)} leave requests",
            "processed_count": len(requests)
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to perform bulk action: {str(e)}"}), 500

# ========== ENHANCED CHAT SYSTEM FOR SIH ==========

# Chat System Models
class ChatbotConversation(db.Model):
    __tablename__ = "chatbot_conversations"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    query = db.Column(db.Text, nullable=False)
    response = db.Column(db.Text, nullable=False)
    intent = db.Column(db.String(50), nullable=True)
    response_type = db.Column(db.String(20), default="text")  # text, timetable, error, info
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship("User", backref="chat_conversations")

class SystemAnnouncement(db.Model):
    __tablename__ = "system_announcements"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    priority = db.Column(db.String(20), default="normal")  # low, normal, high, urgent
    target_roles = db.Column(db.String(100), nullable=True)  # comma-separated roles
    is_active = db.Column(db.Boolean, default=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)
    
    creator = db.relationship("User", backref="announcements")

# Enhanced Intent Recognition for SIH
INTENTS = {
    "timetable": ["timetable", "schedule", "classes", "my classes", "my schedule"],
    "next_class": ["next class", "upcoming", "when is my", "what's next", "next lecture"],
    "free_rooms": ["free rooms", "available rooms", "empty rooms", "vacant", "room availability"],
    "faculty_load": ["faculty load", "teacher workload", "teaching hours", "faculty stats"],
    "room_utilization": ["room usage", "room utilization", "room stats", "room occupancy"],
    "leave_status": ["leave status", "my leave", "leave requests", "absence"],
    "announcements": ["announcements", "notices", "updates", "news"],
    "help": ["help", "what can you do", "commands", "assist", "guide"],
    "swap_request": ["swap", "exchange", "substitute", "replace class"],
    "room_booking": ["book room", "reserve room", "room booking", "room reservation"]
}

def detect_intent(query: str) -> str:
    """Enhanced intent detection with SIH-specific keywords"""
    query = query.lower().strip()
    
    # Check for exact matches first
    for intent, keywords in INTENTS.items():
        if any(f" {kw} " in f" {query} " for kw in keywords):
            return intent
    
    # Check for partial matches
    for intent, keywords in INTENTS.items():
        if any(kw in query for kw in keywords):
            return intent
    
    return "unknown"

def save_conversation(user_id: int, query: str, response: str, intent: str, response_type: str = "text"):
    """Save conversation to database"""
    try:
        conversation = ChatbotConversation(
            user_id=user_id,
            query=query,
            response=response,
            intent=intent,
            response_type=response_type
        )
        db.session.add(conversation)
        db.session.commit()
    except Exception as e:
        print(f"Error saving conversation: {e}")

# ========== CHAT SYSTEM ENDPOINTS ==========

@app.route("/api/chatbot", methods=["POST", "OPTIONS"])
@token_required
def chatbot_assistant(current_user):
    """Enhanced AI Assistant for SIH timetable queries"""
    
    if request.method == "OPTIONS":
        response = make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,x-access-token")
        response.headers.add("Access-Control-Allow-Methods", "POST,OPTIONS")
        return response
    
    try:
        data = request.get_json() or {}
        query = (data.get("message") or "").strip()

        if not query:
            response_text = "👋 Hi! I'm your SIH Timetable Assistant. I can help you with:\n\n"
            response_text += "📅 **Timetable & Classes:**\n• 'my timetable' - View your schedule\n• 'next class' - Find upcoming class\n\n"
            response_text += "🏫 **Rooms & Facilities:**\n• 'free rooms' - Check available rooms\n• 'book room' - Reserve a room\n\n"
            response_text += "👨‍🏫 **Faculty & Admin:**\n• 'faculty load' - Check teacher workload\n• 'room utilization' - Room usage stats\n\n"
            response_text += "📢 **Other:**\n• 'announcements' - View latest updates\n• 'leave status' - Check leave requests\n• 'help' - Show all commands"
            
            return jsonify({
                "success": True,
                "response": response_text,
                "type": "greeting",
                "timestamp": datetime.utcnow().isoformat()
            })

        intent = detect_intent(query)
        
        # Handle different intents with enhanced responses
        if intent == "help":
            response_text = "🤖 **SIH Timetable Assistant Commands:**\n\n"
            response_text += "📅 **Schedule Management:**\n• 'my timetable' - View your complete schedule\n• 'next class' - Find your next class\n• 'today classes' - Today's schedule\n\n"
            response_text += "🏫 **Room Management:**\n• 'free rooms' - Currently available rooms\n• 'book room' - Reserve a room\n• 'room status' - Room occupancy\n\n"
            response_text += "👨‍🏫 **Faculty Features:**\n• 'faculty load' - Teaching workload\n• 'swap class' - Request class swap\n• 'leave status' - Check leave requests\n\n"
            response_text += "📢 **System Info:**\n• 'announcements' - Latest updates\n• 'room utilization' - Room usage statistics\n• 'help' - Show this menu"
            
            if current_user.role == "admin":
                response_text += "\n\n🔧 **Admin Commands:**\n• 'system stats' - Overall statistics\n• 'pending requests' - Review pending items"
            
            save_conversation(current_user.id, query, response_text, intent, "help")
            return jsonify({
                "success": True,
                "response": response_text,
                "type": "help",
                "timestamp": datetime.utcnow().isoformat()
            })

        elif intent == "timetable":
            result = get_user_timetable_chatbot(current_user)
            save_conversation(current_user.id, query, result.json["response"], intent, result.json["type"])
            return result

        elif intent == "next_class":
            result = get_next_class_chatbot(current_user)
            save_conversation(current_user.id, query, result.json["response"], intent, result.json["type"])
            return result

        elif intent == "free_rooms":
            result = get_free_rooms_chatbot(current_user)
            save_conversation(current_user.id, query, result.json["response"], intent, result.json["type"])
            return result

        elif intent == "faculty_load":
            if current_user.role in ["admin", "teacher"]:
                result = get_faculty_load_chatbot()
                save_conversation(current_user.id, query, result.json["response"], intent, result.json["type"])
                return result
            else:
                response_text = "❌ Only teachers and administrators can check faculty workload."
                save_conversation(current_user.id, query, response_text, intent, "error")
                return jsonify({
                    "success": False,
                    "response": response_text,
                    "type": "error",
                    "timestamp": datetime.utcnow().isoformat()
                })

        elif intent == "room_utilization":
            if current_user.role == "admin":
                result = get_room_utilization_chatbot()
                save_conversation(current_user.id, query, result.json["response"], intent, result.json["type"])
                return result
            else:
                response_text = "❌ Only administrators can check room utilization statistics."
                save_conversation(current_user.id, query, response_text, intent, "error")
                return jsonify({
                    "success": False,
                    "response": response_text,
                    "type": "error",
                    "timestamp": datetime.utcnow().isoformat()
                })

        elif intent == "leave_status":
            result = get_leave_status_chatbot(current_user)
            save_conversation(current_user.id, query, result.json["response"], intent, result.json["type"])
            return result

        elif intent == "announcements":
            result = get_announcements_chatbot(current_user)
            save_conversation(current_user.id, query, result.json["response"], intent, result.json["type"])
            return result

        elif intent == "swap_request":
            result = get_swap_requests_chatbot(current_user)
            save_conversation(current_user.id, query, result.json["response"], intent, result.json["type"])
            return result

        else:
            response_text = "🤔 I didn't understand that. Here are some things I can help with:\n\n"
            response_text += "• Ask about your 'timetable' or 'next class'\n• Check 'free rooms' or 'room availability'\n"
            response_text += "• View 'announcements' or 'leave status'\n• Type 'help' for all commands"
            
            save_conversation(current_user.id, query, response_text, intent, "unknown")
            return jsonify({
                "success": True,
                "response": response_text,
                "type": "unknown",
                "timestamp": datetime.utcnow().isoformat()
            })

    except Exception as e:
        error_response = f"❌ Sorry, I encountered an error: {str(e)}"
        save_conversation(current_user.id, query, error_response, "error", "error")
        return jsonify({
            "success": False,
            "response": error_response,
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        }), 500

# Enhanced Chatbot Helper Functions
def get_user_timetable_chatbot(current_user):
    """Enhanced timetable retrieval for chatbot"""
    try:
        if current_user.role == "student":
            if not current_user.section_id:
                return jsonify({
                    "success": False,
                    "response": "❌ You're not assigned to a section. Please contact the administrator.",
                    "type": "error",
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            entries = Timetable.query.filter_by(section_id=current_user.section_id).all()
            if not entries:
                return jsonify({
                    "success": True,
                    "response": "📅 No timetable found for your section. Please contact the administrator.",
                    "type": "info",
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            # Enhanced formatting
            schedule = {}
            for entry in entries:
                day = entry.day
                if day not in schedule:
                    schedule[day] = []
                schedule[day].append({
                    "time": f"{entry.slot}:00",
                    "course": entry.course.name,
                    "room": entry.room.name,
                    "faculty": entry.faculty.faculty_name,
                    
                })
            
            # Sort by time
            for day in schedule:
                schedule[day].sort(key=lambda x: x["time"])
            
            response = f"📅 **Your Timetable - {current_user.section.name} (Year {current_user.year})**\n\n"
            for day, classes in schedule.items():
                response += f"**{day}:**\n"
                for cls in classes:
                    response += f"🕐 {cls['time']} - **{cls['course']})\n"
                    response += f"   📍 {cls['room']} | 👨‍🏫 {cls['faculty']}\n\n"
            
            return jsonify({
                "success": True,
                "response": response,
                "type": "timetable",
                "data": schedule,
                "timestamp": datetime.utcnow().isoformat()
            })

        elif current_user.role == "teacher":
            faculty = Faculty.query.filter_by(
                faculty_name=current_user.full_name, 
                dept_id=current_user.dept_id
            ).first()
            
            if not faculty:
                return jsonify({
                    "success": False,
                    "response": "❌ Faculty record not found. Please contact the administrator.",
                    "type": "error",
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            entries = Timetable.query.filter_by(faculty_id=faculty.faculty_id).all()
            if not entries:
                return jsonify({
                    "success": True,
                    "response": "📅 You have no classes scheduled.",
                    "type": "info",
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            response = f"👨‍🏫 **Your Teaching Schedule** ({len(entries)} classes)\n\n"
            for entry in entries:
                response += f"🕐 **{entry.day} {entry.slot}:00**\n"
                response += f"📚 {entry.course.name} \n"
                response += f"👥 Section {entry.section.name}, Year {entry.section.year}\n"
                response += f"📍 {entry.room.name}\n\n"
            
            return jsonify({
                "success": True,
                "response": response,
                "type": "timetable",
                "timestamp": datetime.utcnow().isoformat()
            })

        else:
            return jsonify({
                "success": False,
                "response": "ℹ️ Administrators don't have personal timetables.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })

    except Exception as e:
        return jsonify({
            "success": False,
            "response": f"❌ Error retrieving timetable: {str(e)}",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        })

def get_next_class_chatbot(current_user):
    """Enhanced next class finder"""
    try:
        now = datetime.now()
        current_day = now.strftime("%a")
        current_hour = now.hour
        
        if current_user.role == "student":
            entries = Timetable.query.filter_by(section_id=current_user.section_id).all()
        elif current_user.role == "teacher":
            faculty = Faculty.query.filter_by(
                faculty_name=current_user.full_name,
                dept_id=current_user.dept_id
            ).first()
            if not faculty:
                return jsonify({
                    "success": False,
                    "response": "❌ Faculty record not found.",
                    "type": "error",
                    "timestamp": datetime.utcnow().isoformat()
                })
            entries = Timetable.query.filter_by(faculty_id=faculty.faculty_id).all()
        else:
            return jsonify({
                "success": False,
                "response": "ℹ️ Next class feature not available for administrators.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })

        if not entries:
            return jsonify({
                "success": True,
                "response": "📅 No classes found in your schedule.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })

        # Find next class
        days_order = ["Mon", "Tue", "Wed", "Thu", "Fri"]
        current_day_idx = days_order.index(current_day) if current_day in days_order else 0
        
        # Look for classes today after current time
        today_classes = [e for e in entries if e.day == current_day and int(e.slot) > current_hour]
        if today_classes:
            next_class = min(today_classes, key=lambda x: int(x.slot))
            time_diff = int(next_class.slot) - current_hour
            response = f"⏰ **Your Next Class:**\n\n"
            response += f"📚 **{next_class.course.name}** \n"
            response += f"🕐 **{next_class.slot}:00** (in {time_diff} hour(s))\n"
            response += f"📍 **{next_class.room.name}**\n"
            response += f"👨‍🏫 **{next_class.faculty.faculty_name}**"
            
            return jsonify({
                "success": True,
                "response": response,
                "type": "next_class",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # Look for classes in upcoming days
        for i in range(1, 6):
            day_idx = (current_day_idx + i) % 5
            day = days_order[day_idx]
            day_classes = [e for e in entries if e.day == day]
            if day_classes:
                next_class = min(day_classes, key=lambda x: int(x.slot))
                response = f"⏰ **Your Next Class:**\n\n"
                response += f"📚 **{next_class.course.name}** \n"
                response += f"📅 **{day} at {next_class.slot}:00**\n"
                response += f"📍 **{next_class.room.name}**\n"
                response += f"👨‍🏫 **{next_class.faculty.faculty_name}**"
                
                return jsonify({
                    "success": True,
                    "response": response,
                    "type": "next_class",
                    "timestamp": datetime.utcnow().isoformat()
                })
        
        return jsonify({
            "success": True,
            "response": "📅 No upcoming classes found this week.",
            "type": "info",
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "response": f"❌ Error finding next class: {str(e)}",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        })

def get_free_rooms_chatbot(current_user):
    """Enhanced free rooms checker"""
    try:
        now = datetime.now()
        current_day = now.strftime("%a")
        current_hour = now.hour
        
        # Find current slot
        time_slots = ["09", "11", "01", "03"]
        current_slot = None
        for slot in time_slots:
            slot_hour = int(slot) if int(slot) > 8 else int(slot) + 12
            if current_hour >= slot_hour and current_hour < slot_hour + 1:
                current_slot = slot
                break
        
        if not current_slot:
            return jsonify({
                "success": True,
                "response": "ℹ️ No classes are currently running.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # Find occupied rooms
        occupied_rooms = db.session.query(Timetable.room_id)\
            .filter_by(day=current_day, slot=current_slot)\
            .distinct().all()
        occupied_room_ids = [room[0] for room in occupied_rooms]
        
        # Find free rooms
        all_rooms = Classroom.query.all()
        free_rooms = [room for room in all_rooms if room.room_id not in occupied_room_ids]
        
        if not free_rooms:
            return jsonify({
                "success": True,
                "response": "🏫 All rooms are currently occupied.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        response = f"🏫 **Free Rooms Right Now** ({current_day} {current_slot}:00)\n\n"
        for room in free_rooms:
            response += f"📍 **{room.name}**\n"
            response += f"   👥 Capacity: {room.capacity}\n"
            if room.resources:
                response += f"   🔧 Resources: {room.resources}\n"
            response += "\n"
        
        return jsonify({
            "success": True,
            "response": response,
            "type": "free_rooms",
            "data": [{"name": r.name, "capacity": r.capacity, "resources": r.resources} for r in free_rooms],
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "response": f"❌ Error checking free rooms: {str(e)}",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        })

def get_faculty_load_chatbot():
    """Enhanced faculty workload checker"""
    try:
        faculty_list = Faculty.query.all()
        if not faculty_list:
            return jsonify({
                "success": True,
                "response": "ℹ️ No faculty found in the system.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        response = "👨‍🏫 **Faculty Workload Summary**\n\n"
        total_hours = 0
        
        for faculty in faculty_list:
            class_count = Timetable.query.filter_by(faculty_id=faculty.faculty_id).count()
            utilization = (class_count / faculty.max_hours) * 100 if faculty.max_hours > 0 else 0
            
            status_emoji = "🟢" if utilization < 80 else "🟡" if utilization < 100 else "🔴"
            response += f"{status_emoji} **{faculty.faculty_name}**\n"
            response += f"   📊 {class_count}/{faculty.max_hours} hours ({utilization:.1f}%)\n"
            response += f"   🏢 {faculty.dept.dept_name}\n\n"
            total_hours += class_count
        
        response += f"📈 **Total Classes Assigned: {total_hours}**"
        
        return jsonify({
            "success": True,
            "response": response,
            "type": "faculty_load",
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "response": f"❌ Error getting faculty load: {str(e)}",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        })

def get_room_utilization_chatbot():
    """Enhanced room utilization checker"""
    try:
        rooms = Classroom.query.all()
        if not rooms:
            return jsonify({
                "success": True,
                "response": "ℹ️ No rooms found in the system.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        response = "🏫 **Room Utilization Report**\n\n"
        total_slots = 20  # 4 slots × 5 days
        
        for room in rooms:
            allocations = Timetable.query.filter_by(room_id=room.room_id).count()
            utilization = (allocations / total_slots) * 100
            
            status_emoji = "🟢" if utilization < 50 else "🟡" if utilization < 80 else "🔴"
            response += f"{status_emoji} **{room.name}**\n"
            response += f"   📊 {allocations}/{total_slots} slots ({utilization:.1f}%)\n"
            response += f"   👥 Capacity: {room.capacity}\n"
            if room.resources:
                response += f"   🔧 Resources: {room.resources}\n"
            response += "\n"
        
        return jsonify({
            "success": True,
            "response": response,
            "type": "room_utilization",
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "response": f"❌ Error getting room utilization: {str(e)}",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        })

def get_leave_status_chatbot(current_user):
    """Get leave status for chatbot"""
    try:
        if current_user.role not in ["teacher", "student"]:
            return jsonify({
                "success": False,
                "response": "ℹ️ Leave status is only available for teachers and students.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        requests = LeaveRequest.query.filter_by(user_id=current_user.id)\
            .order_by(LeaveRequest.created_at.desc()).limit(5).all()
        
        if not requests:
            return jsonify({
                "success": True,
                "response": "📅 No leave requests found.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        response = "📅 **Your Recent Leave Requests**\n\n"
        for req in requests:
            status_emoji = {"pending": "⏳", "approved": "✅", "rejected": "❌", "cancelled": "🚫"}.get(req.status, "❓")
            response += f"{status_emoji} **{req.leave_type.title()} Leave**\n"
            response += f"   📅 {req.start_date} to {req.end_date}\n"
            response += f"   📝 {req.reason[:50]}{'...' if len(req.reason) > 50 else ''}\n"
            response += f"   🏷️ Status: {req.status.title()}\n\n"
        
        return jsonify({
            "success": True,
            "response": response,
            "type": "leave_status",
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "response": f"❌ Error getting leave status: {str(e)}",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        })

def get_announcements_chatbot(current_user):
    """Get system announcements for chatbot"""
    try:
        # Get active announcements for user's role
        announcements = SystemAnnouncement.query.filter(
            SystemAnnouncement.is_active == True,
            or_(
                SystemAnnouncement.target_roles.is_(None),
                SystemAnnouncement.target_roles.contains(current_user.role)
            ),
            or_(
                SystemAnnouncement.expires_at.is_(None),
                SystemAnnouncement.expires_at > datetime.utcnow()
            )
        ).order_by(SystemAnnouncement.created_at.desc()).limit(5).all()
        
        if not announcements:
            return jsonify({
                "success": True,
                "response": "📢 No announcements at the moment.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        response = "📢 **Latest Announcements**\n\n"
        for ann in announcements:
            priority_emoji = {"low": "🔵", "normal": "🟡", "high": "🟠", "urgent": "🔴"}.get(ann.priority, "🟡")
            response += f"{priority_emoji} **{ann.title}**\n"
            response += f"   📝 {ann.message}\n"
            response += f"   📅 {ann.created_at.strftime('%Y-%m-%d %H:%M')}\n\n"
        
        return jsonify({
            "success": True,
            "response": response,
            "type": "announcements",
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "response": f"❌ Error getting announcements: {str(e)}",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        })

def get_swap_requests_chatbot(current_user):
    """Get swap requests for chatbot"""
    try:
        if current_user.role != "teacher":
            return jsonify({
                "success": False,
                "response": "ℹ️ Swap requests are only available for teachers.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        faculty = Faculty.query.filter_by(
            faculty_name=current_user.full_name,
            dept_id=current_user.dept_id
        ).first()
        
        if not faculty:
            return jsonify({
                "success": False,
                "response": "❌ Faculty record not found.",
                "type": "error",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # Get requests where current user is requester or requested
        requests = SwapRequest.query.filter(
            or_(
                SwapRequest.requester_id == faculty.faculty_id,
                SwapRequest.requested_id == faculty.faculty_id
            )
        ).order_by(SwapRequest.created_at.desc()).limit(5).all()
        
        if not requests:
            return jsonify({
                "success": True,
                "response": "🔄 No swap requests found.",
                "type": "info",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        response = "🔄 **Your Swap Requests**\n\n"
        for req in requests:
            status_emoji = {"pending": "⏳", "approved": "✅", "rejected": "❌", "cancelled": "🚫"}.get(req.status, "❓")
            response += f"{status_emoji} **{req.requester.faculty_name} ↔️ {req.requested.faculty_name}**\n"
            response += f"   📅 {req.requester_date} {req.requester_slot} ↔️ {req.requested_date} {req.requested_slot}\n"
            response += f"   🏷️ Status: {req.status.title()}\n\n"
        
        return jsonify({
            "success": True,
            "response": response,
            "type": "swap_requests",
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "response": f"❌ Error getting swap requests: {str(e)}",
            "type": "error",
            "timestamp": datetime.utcnow().isoformat()
        })

# ========== CHAT SYSTEM MANAGEMENT ENDPOINTS ==========

@app.route("/api/chat/conversation", methods=["GET"])
@token_required
def get_chatbot_history(current_user):
    """Get user's chatbot conversation history"""
    try:
        conversations = ChatbotConversation.query.filter_by(user_id=current_user.id)\
            .order_by(ChatbotConversation.timestamp.desc())\
            .limit(50).all()
        
        history = []
        for conv in reversed(conversations):
            history.extend([
                {
                    "type": "user",
                    "message": conv.query,
                    "timestamp": conv.timestamp.isoformat()
                },
                {
                    "type": "bot",
                    "message": conv.response,
                    "timestamp": conv.timestamp.isoformat()
                }
            ])
        
        return jsonify({
            "success": True,
            "conversation": history,
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }), 500

@app.route("/api/chat/clear", methods=["POST"])
@token_required
def clear_chat_history(current_user):
    """Clear user's chat history"""
    try:
        ChatbotConversation.query.filter_by(user_id=current_user.id).delete()
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Chat history cleared successfully",
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }), 500

# ========== ANNOUNCEMENT SYSTEM ENDPOINTS ==========

@app.route("/api/announcements", methods=["GET"])
@token_required
def get_announcements(current_user):
    """Get system announcements"""
    try:
        announcements = SystemAnnouncement.query.filter(
            SystemAnnouncement.is_active == True,
            or_(
                SystemAnnouncement.target_roles.is_(None),
                SystemAnnouncement.target_roles.contains(current_user.role)
            ),
            or_(
                SystemAnnouncement.expires_at.is_(None),
                SystemAnnouncement.expires_at > datetime.utcnow()
            )
        ).order_by(SystemAnnouncement.created_at.desc()).all()
        
        return jsonify([{
            "id": ann.id,
            "title": ann.title,
            "message": ann.message,
            "priority": ann.priority,
            "created_at": ann.created_at.isoformat(),
            "expires_at": ann.expires_at.isoformat() if ann.expires_at else None
        } for ann in announcements])
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/announcements", methods=["POST"])
@token_required
@admin_required
def create_announcement(current_user):
    """Create new announcement (Admin only)"""
    try:
        data = request.json
        required_fields = ["title", "message"]
        
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields: title, message"}), 400
        
        announcement = SystemAnnouncement(
            title=data["title"],
            message=data["message"],
            priority=data.get("priority", "normal"),
            target_roles=data.get("target_roles"),
            created_by=current_user.id,
            expires_at=datetime.fromisoformat(data["expires_at"]) if data.get("expires_at") else None
        )
        
        db.session.add(announcement)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Announcement created successfully",
            "announcement_id": announcement.id
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------- MAIN ----------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("Enhanced database created successfully!")
        
        # Create sample data
        create_sample_data()
        
    print("Starting Enhanced Flask server...")
    print("API will be available at: http://127.0.0.1:5000")
    print("\n=== SAMPLE LOGIN CREDENTIALS ===")
    print("Teacher: username='teacher1', password='password123'")
    print("Student: username='student1', password='password123'")
    print("=====================================")
    app.run(debug=True, host='0.0.0.0', port=5000)

