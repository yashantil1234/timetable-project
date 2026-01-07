import os
from datetime import datetime, timedelta
import pandas as pd
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
from ortools.sat.python import cp_model

# -----------------------
# CONFIGURATION
# -----------------------
app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, "timetable_final.db")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "SIHSecretKey2025"

db = SQLAlchemy(app)

# -----------------------
# DATABASE MODELS
# -----------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # "teacher", "student", or "admin"
    dept_id = db.Column(db.Integer, db.ForeignKey("department.id"), nullable=True)
    year = db.Column(db.Integer, nullable=True)
    section_id = db.Column(db.Integer, db.ForeignKey("section.id"), nullable=True)
    room_occupancies = db.relationship("RoomOccupancy", backref="faculty", lazy=True)
    
    # Proper relationship to Faculty
    faculty_record = db.relationship("Faculty", backref="user_account", uselist=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    dept_name = db.Column(db.String(100), nullable=False, unique=True)
    faculty = db.relationship("Faculty", backref="department", lazy=True)
    courses = db.relationship("Course", backref="department", lazy=True)
    course_allocations = db.relationship("CourseAllocation", backref="department", lazy=True)
    sections = db.relationship("Section", backref="department", lazy=True)
    users = db.relationship("User", backref="department", lazy=True)

class Faculty(db.Model):
    faculty_id = db.Column(db.Integer, primary_key=True)
    faculty_name = db.Column(db.String(100), nullable=False)
    max_hours = db.Column(db.Integer, default=12)
    dept_id = db.Column(db.Integer, db.ForeignKey("department.id"))
    
    # Link Faculty to User account
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), unique=True, nullable=True)
    
    courses = db.relationship("Course", backref="faculty", lazy=True)
    timetables = db.relationship("Timetable", backref="faculty", lazy=True)

class Section(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(1), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    dept_id = db.Column(db.Integer, db.ForeignKey("department.id"))
    users = db.relationship("User", backref="section", lazy=True)
    timetables = db.relationship("Timetable", backref="section", lazy=True)
    __table_args__ = (db.UniqueConstraint("name", "year", "dept_id", name="unique_section_per_year_dept"),)

class Course(db.Model):
    course_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    credits = db.Column(db.Integer, nullable=True)
    year = db.Column(db.Integer, nullable=False, default=1)
    semester = db.Column(db.Integer, nullable=False, default=1)
    dept_id = db.Column(db.Integer, db.ForeignKey("department.id"))
    faculty_id = db.Column(db.Integer, db.ForeignKey("faculty.faculty_id"), nullable=True) # Made nullable
    timetables = db.relationship("Timetable", backref="course", lazy=True)
    hours_per_week = db.Column(db.Integer, nullable=False, default=4)
class Classroom(db.Model):
    room_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)  # Added unique constraint
    capacity = db.Column(db.Integer, nullable=False)
    resources = db.Column(db.String(200))
    occupancies = db.relationship("RoomOccupancy", backref="room", lazy=True)
    timetables = db.relationship("Timetable", backref="room", lazy=True)

class RoomOccupancy(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey("classroom.room_id"), nullable=False)
    faculty_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="free")
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class CourseAllocation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    dept_id = db.Column(db.Integer, db.ForeignKey("department.id"))
    year = db.Column(db.Integer, nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    total_courses = db.Column(db.Integer, nullable=False, default=0)
    allocated_courses = db.Column(db.Integer, nullable=False, default=0)
    __table_args__ = (db.UniqueConstraint('dept_id', 'year', 'semester', name='_dept_year_sem_uc'),)

class Timetable(db.Model):
    timetable_id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("course.course_id"))
    section_id = db.Column(db.Integer, db.ForeignKey("section.id"))
    faculty_id = db.Column(db.Integer, db.ForeignKey("faculty.faculty_id"))
    room_id = db.Column(db.Integer, db.ForeignKey("classroom.room_id"))
    day = db.Column(db.String(20))
    slot = db.Column(db.String(20))
    
    # Add unique constraint to prevent duplicate entries
    __table_args__ = (
        db.UniqueConstraint('day', 'slot', 'room_id', name='_unique_room_time'),
        db.UniqueConstraint('day', 'slot', 'faculty_id', name='_unique_faculty_time'),
        db.UniqueConstraint('day', 'slot', 'section_id', name='_unique_section_time'),
    )

# -----------------------
# JWT AUTH DECORATORS
# -----------------------
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("x-access-token")
        if not token:
            return jsonify({"error": "Token missing"}), 401
        try:
            data = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = User.query.get(data["user_id"])
            if not current_user:
                return jsonify({"error": "Invalid token"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token is invalid"}), 401
        except Exception as e:
            return jsonify({"error": "Token invalid", "details": str(e)}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return f(current_user, *args, **kwargs)
    return decorated

def teacher_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role not in ["teacher", "admin"]:
            return jsonify({"error": "Teacher or admin access required"}), 403
        return f(current_user, *args, **kwargs)
    return decorated

# -----------------------
# HELPER FUNCTIONS
# -----------------------
def load_csv_data():
    """Load CSV data with improved error handling and validation"""
    csv_files = {
        "departments": "data/departments_test_data.csv",
        "faculty": "data/faculty_test_data.csv",
        "courses": "data/courses_test_data.csv",
        "rooms": "data/room_data.csv",
        "students": "data/students_test_data.csv"
    }

    loaded_files = []
    errors = []
    os.makedirs("data", exist_ok=True)

    try:
        # Load Departments first (no dependencies)
        if os.path.exists(csv_files["departments"]):
            try:
                departments = pd.read_csv(csv_files["departments"])
                if 'dept_name' not in departments.columns:
                    errors.append("departments.csv missing 'dept_name' column")
                else:
                    for _, row in departments.iterrows():
                        if pd.notna(row['dept_name']) and not Department.query.filter_by(dept_name=row['dept_name']).first():
                            db.session.add(Department(dept_name=row['dept_name']))
                    db.session.commit()
                    loaded_files.append("departments")
            except Exception as e:
                errors.append(f"Error loading departments: {e}")

        # Load Faculty (depends on departments)
        if os.path.exists(csv_files["faculty"]):
            try:
                faculty = pd.read_csv(csv_files["faculty"])
                required_cols = ['faculty_name', 'dept_name']
                missing_cols = [col for col in required_cols if col not in faculty.columns]
                if missing_cols:
                    errors.append(f"faculty.csv missing columns: {missing_cols}")
                else:
                    for _, row in faculty.iterrows():
                        if pd.notna(row['faculty_name']) and not Faculty.query.filter_by(faculty_name=row['faculty_name']).first():
                            dept = Department.query.filter_by(dept_name=row['dept_name']).first()
                            if dept:
                                db.session.add(Faculty(
                                    faculty_name=row['faculty_name'],
                                    max_hours=row.get('max_hours', 12),
                                    dept_id=dept.id
                                ))
                            else:
                                errors.append(f"Department '{row['dept_name']}' not found for faculty '{row['faculty_name']}'")
                    db.session.commit()
                    loaded_files.append("faculty")
            except Exception as e:
                errors.append(f"Error loading faculty: {e}")

        # Load Courses (depends on departments and faculty)
        if os.path.exists(csv_files["courses"]):
            try:
                courses = pd.read_csv(csv_files["courses"])
                required_cols = ['name', 'type', 'dept_name']  # faculty_name is now optional
                missing_cols = [col for col in required_cols if col not in courses.columns]
                if missing_cols:
                    errors.append(f"courses.csv missing columns: {', '.join(missing_cols)}")
                else:
                    for _, row in courses.iterrows():
                        dept = Department.query.filter_by(dept_name=row['dept_name']).first()
                        if not dept:
                            errors.append(f"Course '{row['name']}' skipped - department '{row['dept_name']}' not found")
                            continue
                        
                        if pd.notna(row['name']) and not Course.query.filter_by(name=row['name'], dept_id=dept.id).first():
                            faculty_member = None
                            faculty_id = None
                            if 'faculty_name' in row and pd.notna(row['faculty_name']):
                                faculty_member = Faculty.query.filter_by(faculty_name=row['faculty_name']).first()
                                if faculty_member:
                                    faculty_id = faculty_member.faculty_id
                                else:
                                    errors.append(f"For course '{row['name']}', faculty '{row['faculty_name']}' not found. Course added without faculty.")
                            
                            new_course = Course(
                                name=row['name'],
                                type=row['type'],
                                credits=row.get('credits', 0),
                                year=row.get('year', 1),
                                semester=row.get('semester', 1),
                                dept_id=dept.id,
                                faculty_id=faculty_id,
                                hours_per_week=row.get('hours_per_week', 6)  # Default to 6 if not provided
                            )
                            db.session.add(new_course)
                    db.session.commit()
                    loaded_files.append("courses")
            except Exception as e:
                errors.append(f"Error loading courses: {e}")

        # Load Rooms (no dependencies)
        if os.path.exists(csv_files["rooms"]):
            try:
                rooms = pd.read_csv(csv_files["rooms"])
                if 'name' not in rooms.columns or 'capacity' not in rooms.columns:
                    errors.append("rooms.csv missing 'name' or 'capacity' columns")
                else:
                    for _, row in rooms.iterrows():
                        if pd.notna(row['name']) and not Classroom.query.filter_by(name=row['name']).first():
                            db.session.add(Classroom(
                                name=row['name'],
                                capacity=int(row['capacity']) if pd.notna(row['capacity']) else 30,
                                resources=row.get('resources', "")
                            ))
                    db.session.commit()
                    loaded_files.append("rooms")
            except Exception as e:
                errors.append(f"Error loading rooms: {e}")
        
        # Load Students (depends on departments and sections)
        if os.path.exists(csv_files["students"]):
            try:
                students = pd.read_csv(csv_files["students"])
                required_cols = ['username', 'password', 'dept_name', 'year', 'section_name']
                missing_cols = [col for col in required_cols if col not in students.columns]
                if missing_cols:
                    errors.append(f"students.csv missing columns: {', '.join(missing_cols)}")
                else:
                    for _, row in students.iterrows():
                        username = str(row['username']).strip()
                        if pd.notna(username) and not User.query.filter_by(username=username).first():
                            dept = Department.query.filter_by(dept_name=row['dept_name']).first()
                            if not dept:
                                errors.append(f"Student '{username}' skipped - department '{row['dept_name']}' not found")
                                continue
                            
                            section = Section.query.filter_by(
                                name=str(row['section_name']).upper(), 
                                year=int(row['year']), 
                                dept_id=dept.id
                            ).first()

                            if not section:
                                errors.append(f"Student '{username}' skipped - section '{row['section_name']}' not found for year {row['year']} in '{row['dept_name']}'")
                                continue
                            
                            new_student = User(
                                username=username,
                                role='student',
                                dept_id=dept.id,
                                year=int(row['year']),
                                section_id=section.id
                            )
                            new_student.set_password(str(row['password']))
                            db.session.add(new_student)
                    db.session.commit()
                    loaded_files.append("students")
            except Exception as e:
                errors.append(f"Error loading students: {str(e)}")


        # Print results
        if loaded_files:
            print(f"CSV data loaded successfully from: {', '.join(loaded_files)}")
        if errors:
            print("CSV loading errors:")
            for error in errors:
                print(f"  - {error}")
        if not loaded_files and not errors:
            print("No CSV files found. Starting with empty database.")

    except Exception as e:
        print(f"Critical error loading CSV data: {e}")

def create_sample_data():
    """Create sample data if database is empty"""
    if Department.query.count() == 0:
        # Add sample departments
        sample_depts = ["Computer Science", "Mathematics", "Physics", "Electronics"]
        for dept_name in sample_depts:
            db.session.add(Department(dept_name=dept_name))
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

        print("Sample data created.")

    # Create default admin user if doesn't exist
    if not User.query.filter_by(username="admin").first():
        admin_user = User(username="admin", role="admin")
        admin_user.set_password("admin123")
        db.session.add(admin_user)
        db.session.commit()
        print("Default admin user created: username=admin, password=admin123")

def generate_timetable_internal():
    """Generate timetable using constraint programming"""
    courses = Course.query.all()
    faculty = Faculty.query.all()
    rooms = Classroom.query.all()
    sections = Section.query.all()

    if not courses or not faculty or not rooms or not sections:
        return {"error": "Need courses, faculty, rooms, and sections to generate timetable"}

    time_slots = ["mon 9-10", "Mon 10-11", "Mon_01", "Mon_03",
                  "Tue_09", "Tue_11", "Tue_01", "Tue_03",
                  "Wed_09", "Wed_11", "Wed_01", "Wed_03",
                  "Thu_09", "Thu_11", "Thu_01", "Thu_03",
                  "Fri_09", "Fri_11", "Fri_01", "Fri_03"]

    model = cp_model.CpModel()
    assignments = {}

    faculty_dict = {f.faculty_id: f for f in faculty}
    room_dict = {r.room_id: r for r in rooms}

    # Decision variables - for each course and each section
    for c in courses:
        assignments[c.course_id] = {}
        # Find sections for this course's year and department
        relevant_sections = Section.query.filter_by(year=c.year, dept_id=c.dept_id).all()
        for section in relevant_sections:
            assignments[c.course_id][section.id] = {}
            for slot in time_slots:
                for r in rooms:
                    assignments[c.course_id][section.id][(slot, r.room_id)] = model.NewBoolVar(
                        f"course_{c.course_id}_section_{section.id}_{slot}_{r.name}"
                    )

    # Constraints
    # Each course-section combination gets exactly one slot and room
    for c in courses:
        relevant_sections = Section.query.filter_by(year=c.year, dept_id=c.dept_id).all()
        for section in relevant_sections:
            if c.course_id in assignments and section.id in assignments[c.course_id]:
                model.Add(sum(assignments[c.course_id][section.id].values()) == 1)

    # Room conflicts - only one course can use a room at any time
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

    # Faculty conflicts - faculty can teach only one course at a time
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

    # Section conflicts - sections can't have multiple courses at the same time
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

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 30.0  # Add time limit
    status = solver.Solve(model)

    # Clear existing timetable
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

            # Save CSV
            os.makedirs("output", exist_ok=True)
            pd.DataFrame(timetable_data).to_csv("output/timetable_final.csv", index=False)
            print("Timetable generated successfully!")
            return {"success": True, "message": "Timetable generated successfully"}
        except Exception as e:
            db.session.rollback()
            return {"error": f"Failed to save timetable: {str(e)}"}
    else:
        return {"error": "Could not generate a feasible timetable. Try reducing constraints or adding more resources."}

# -----------------------
# AUTH ROUTES
# -----------------------
@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        username = data.get("username", "").strip()
        password = data.get("password", "")
        role = data.get("role", "").strip().lower()
        dept_id = data.get("dept_id")
        year = data.get("year")
        section_id = data.get("section_id")

        # Validation
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400
        if role not in ["student", "teacher", "admin"]:
            return jsonify({"error": "Role must be student, teacher, or admin"}), 400
        if User.query.filter_by(username=username).first():
            return jsonify({"error": "Username already exists"}), 400

        # Additional validation for students
        if role == "student":
            if not dept_id or not year or not section_id:
                return jsonify({"error": "Students must have department, year, and section"}), 400

        user = User(username=username, role=role, dept_id=dept_id, year=year, section_id=section_id)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return jsonify({"message": f"{role.capitalize()} registered successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        username = data.get("username", "").strip()
        password = data.get("password", "")
        
        if not username or not password:
            return jsonify({"error": "Username and password are required"}), 400
            
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            token = jwt.encode(
                {"user_id": user.id, "exp": datetime.utcnow() + timedelta(hours=8)}, 
                app.config["SECRET_KEY"], 
                algorithm="HS256"
            )
            return jsonify({
                "token": token, 
                "role": user.role, 
                "user_id": user.id,
                "username": user.username
            }), 200
        return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"error": f"Login failed: {str(e)}"}), 500

# -----------------------
# HOME ROUTE
# -----------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Combined Timetable Management System API",
        "status": "running",
        "version": "2.0",
        "roles": ["admin", "teacher", "student"],
        "endpoints": {
            "auth": ["/register", "/login"],
            "admin": [
                "/admin/departments", 
                "/admin/faculty", 
                "/admin/courses", 
                "/admin/rooms", 
                "/admin/sections", 
                "/admin/allocations", 
                "/admin/generate_timetable",
                "/admin/students",
                "/admin/students/<id>",
                "/admin/students/delete_bulk"
            ],
            "teacher": ["/teacher/timetable", "/teacher/mark_room", "/rooms"],
            "student": ["/student/timetable"],
            "general": ["/get_timetable", "/generate_csvs"],
            "upload": ["/upload/departments", "/upload/faculty", "/upload/students"]
        }
    })

# -----------------------
# ADMIN ROUTES
# -----------------------
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
    
    elif request.method == "POST":
        try:
            data = request.json
            if not data or not data.get("dept_name", "").strip():
                return jsonify({"error": "Department name is required"}), 400

            dept_name = data["dept_name"].strip()
            existing = Department.query.filter_by(dept_name=dept_name).first()
            if existing:
                return jsonify({"error": "Department already exists"}), 400

            dept = Department(dept_name=dept_name)
            db.session.add(dept)
            db.session.commit()
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
                    "max_hours": f.max_hours,
                    "has_user_account": f.user_id is not None
                }
                for f in faculty
            ])
        except Exception as e:
            return jsonify({"error": f"Failed to fetch faculty: {str(e)}"}), 500
    
    elif request.method == "POST":
        try:
            data = request.json
            if not data or not data.get("faculty_name", "").strip() or not data.get("dept_name", "").strip():
                return jsonify({"error": "Faculty name and department are required"}), 400

            dept = Department.query.filter_by(dept_name=data["dept_name"]).first()
            if not dept:
                return jsonify({"error": "Department not found"}), 404

            faculty_name = data["faculty_name"].strip()
            existing = Faculty.query.filter_by(faculty_name=faculty_name).first()
            if existing:
                return jsonify({"error": "Faculty member already exists"}), 400

            faculty = Faculty(
                faculty_name=faculty_name,
                max_hours=data.get("max_hours", 12),
                dept_id=dept.id
            )
            db.session.add(faculty)
            db.session.commit()
            return jsonify({"message": "Faculty added successfully!", "faculty_id": faculty.faculty_id})
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to add faculty: {str(e)}"}), 500

@app.route("/admin/courses", methods=["GET", "POST"])
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
    
    elif request.method == "POST":
        try:
            data = request.json
            
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            # Note: `hours_per_week` is now a recommended field
            required_fields = ["name", "type", "dept_name", "year", "semester"]
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
            return jsonify({"error": f"Failed to fetch rooms: {str(e)}"}), 500
    
    elif request.method == "POST":
        try:
            data = request.json
            if not data or not data.get("name", "").strip() or not data.get("capacity"):
                return jsonify({"error": "Room name and capacity are required"}), 400

            name = data["name"].strip()
            capacity = data["capacity"]
            
            try:
                capacity = int(capacity)
                if capacity <= 0:
                    return jsonify({"error": "Capacity must be a positive integer"}), 400
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid capacity value"}), 400

            if Classroom.query.filter_by(name=name).first():
                return jsonify({"error": "Room with this name already exists"}), 400

            room = Classroom(
                name=name,
                capacity=capacity,
                resources=data.get("resources", "").strip()
            )
            db.session.add(room)
            db.session.commit()
            return jsonify({"message": "Room added", "room_id": room.room_id}), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to add room: {str(e)}"}), 500

@app.route("/admin/sections", methods=["GET", "POST"])
@token_required
@admin_required
def admin_sections(current_user):
    if request.method == "GET":
        try:
            dept_name = request.args.get("dept_name")
            year = request.args.get("year", type=int)

            query = Section.query
            if dept_name:
                dept = Department.query.filter_by(dept_name=dept_name).first()
                if not dept:
                    return jsonify([]), 200
                query = query.filter_by(dept_id=dept.id)
            if year:
                query = query.filter_by(year=year)

            sections = query.order_by(Section.year, Section.name).all()
            
            result = []
            for s in sections:
                student_count = User.query.filter_by(role='student', section_id=s.id).count()
                result.append({
                    "id": s.id, 
                    "name": s.name, 
                    "year": s.year, 
                    "dept_name": s.department.dept_name,
                    "student_count": student_count
                })
                
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": f"Failed to fetch sections: {str(e)}"}), 500
    
    elif request.method == "POST":
        try:
            ALLOWED_SECTION_LETTERS = [chr(i) for i in range(65, 81)]  # A..P
            MAX_SECTIONS_PER_YEAR = 15
            
            data = request.json or {}
            dept_name = data.get("dept_name", "").strip()
            year = data.get("year")
            name = data.get("name", "").strip().upper() if data.get("name") else None

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

            existing_count = Section.query.filter_by(dept_id=dept.id, year=year).count()
            if existing_count >= MAX_SECTIONS_PER_YEAR:
                return jsonify({"error": f"Maximum {MAX_SECTIONS_PER_YEAR} sections already created"}), 400

            if name:
                if name not in ALLOWED_SECTION_LETTERS:
                    return jsonify({"error": f"Invalid section name. Allowed: {', '.join(ALLOWED_SECTION_LETTERS)}"}), 400
                if Section.query.filter_by(dept_id=dept.id, year=year, name=name).first():
                    return jsonify({"error": f"Section {name} already exists"}), 400
            else:
                used_letters = {s.name for s in Section.query.filter_by(dept_id=dept.id, year=year).all()}
                name = None
                for letter in ALLOWED_SECTION_LETTERS:
                    if letter not in used_letters:
                        name = letter
                        break
                if not name:
                    return jsonify({"error": "No available section letters left"}), 400

            section = Section(name=name, year=year, dept_id=dept.id)
            db.session.add(section)
            db.session.commit()
            return jsonify({
                "message": f"Section {name} added for {dept_name} Year {year}", 
                "section": {"id": section.id, "name": section.name, "year": section.year}
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to add section: {str(e)}"}), 500

@app.route("/admin/allocations", methods=["GET", "POST"])
@token_required
@admin_required
def admin_allocations(current_user):
    if request.method == "GET":
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
            return jsonify({"error": f"Failed to fetch allocations: {str(e)}"}), 500
    
    elif request.method == "POST":
        try:
            data = request.json
            required_fields = ["dept_name", "year", "semester", "total_courses"]
            if not all(data.get(field) is not None for field in required_fields):
                return jsonify({"error": "Department, year, semester, and total courses are required"}), 400

            dept = Department.query.filter_by(dept_name=data["dept_name"]).first()
            if not dept:
                return jsonify({"error": "Department not found"}), 404

            try:
                year = int(data["year"])
                semester = int(data["semester"])
                total_courses = int(data["total_courses"])
                
                if year < 1 or year > 4:
                    return jsonify({"error": "Year must be between 1 and 4"}), 400
                if semester < 1 or semester > 2:
                    return jsonify({"error": "Semester must be 1 or 2"}), 400
                if total_courses < 0:
                    return jsonify({"error": "Total courses must be non-negative"}), 400
            except (ValueError, TypeError):
                return jsonify({"error": "Invalid numeric values"}), 400

            existing = CourseAllocation.query.filter_by(
                dept_id=dept.id,
                year=year,
                semester=semester
            ).first()

            if existing:
                existing.total_courses = total_courses
            else:
                allocation = CourseAllocation(
                    dept_id=dept.id,
                    year=year,
                    semester=semester,
                    total_courses=total_courses,
                    allocated_courses=0
                )
                db.session.add(allocation)

            db.session.commit()
            return jsonify({"message": "Course allocation set successfully"}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to set allocation: {str(e)}"}), 500

@app.route("/admin/generate_timetable", methods=["POST"])
@token_required
@admin_required
def admin_generate_timetable(current_user):
    try:
        result = generate_timetable_internal()
        if "error" in result:
            return jsonify(result), 400

        timetable = Timetable.query.all()
        result_data = []
        faculty_dict = {f.faculty_id: f.faculty_name for f in Faculty.query.all()}
        room_dict = {r.room_id: r.name for r in Classroom.query.all()}

        for t in timetable:
            c = Course.query.get(t.course_id)
            s = Section.query.get(t.section_id)
            if c and s:
                result_data.append({
                    "course": c.name,
                    "section": s.name,
                    "faculty": faculty_dict.get(t.faculty_id, "Unknown"),
                    "room": room_dict.get(t.room_id, "Unknown"),
                    "day": t.day,
                    "slot": t.slot,
                    "year": c.year,
                    "semester": c.semester
                })
        return jsonify({"message": "Timetable generated", "timetable": result_data}), 200
    except Exception as e:
        return jsonify({"error": f"Timetable generation failed: {str(e)}"}), 500

@app.route("/admin/students", methods=["GET", "POST"])
@token_required
@admin_required
def admin_students(current_user):
    if request.method == "GET":
        try:
            students = User.query.filter_by(role='student').join(Department).join(Section).all()
            result = [
                {
                    "id": s.id,
                    "username": s.username,
                    "dept_name": s.department.dept_name,
                    "year": s.year,
                    "section_name": s.section.name
                }
                for s in students
            ]
            return jsonify(result), 200
        except Exception as e:
            return jsonify({"error": f"Failed to fetch students: {str(e)}"}), 500

    elif request.method == "POST":
        try:
            data = request.json
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            username = data.get("username", "").strip()
            password = data.get("password", "")
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
            data = request.json
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            if 'username' in data:
                student.username = data['username'].strip()
            if 'dept_id' in data:
                student.dept_id = data['dept_id']
            if 'year' in data:
                student.year = data['year']
            if 'section_id' in data:
                student.section_id = data['section_id']
            if 'password' in data and data['password']:
                student.set_password(data['password'])

            db.session.commit()
            return jsonify({"message": f"Student {student.username} updated successfully."}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to update student: {str(e)}"}), 500

    elif request.method == "DELETE":
        try:
            db.session.delete(student)
            db.session.commit()
            return jsonify({"message": f"Student {student.username} deleted successfully."}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to delete student: {str(e)}"}), 500

@app.route("/admin/students/delete_bulk", methods=["POST"])
@token_required
@admin_required
def admin_delete_bulk_students(current_user):
    try:
        data = request.json
        if not data or 'student_ids' not in data or not isinstance(data['student_ids'], list):
            return jsonify({"error": "A list of 'student_ids' is required"}), 400
        
        ids_to_delete = data['student_ids']
        if not ids_to_delete:
            return jsonify({"message": "No student IDs provided."}), 200

        num_deleted = User.query.filter(User.id.in_(ids_to_delete), User.role == 'student').delete(synchronize_session=False)
        db.session.commit()

        return jsonify({"message": f"Successfully deleted {num_deleted} students."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete students in bulk: {str(e)}"}), 500

# -----------------------
# TEACHER ROUTES
# -----------------------
@app.route("/teacher/mark_room", methods=["POST"])
@token_required
@teacher_required
def mark_room(current_user):
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        room_id = data.get("room_id")
        status = data.get("status", "").strip().lower()

        if status not in ["free", "occupied"]:
            return jsonify({"error": "Status must be 'free' or 'occupied'"}), 400

        room = Classroom.query.get(room_id)
        if not room:
            return jsonify({"error": "Room not found"}), 404

        occupancy = RoomOccupancy(
            room_id=room.room_id,
            faculty_id=current_user.id,
            status=status,
            timestamp=datetime.utcnow()
        )
        db.session.add(occupancy)
        db.session.commit()

        return jsonify({
            "message": f"Room {room.name} marked as {status} by {current_user.username}",
            "room_id": room.room_id,
            "status": status
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to mark room: {str(e)}"}), 500

@app.route("/rooms", methods=["GET"])
@token_required
def get_rooms_status(current_user):
    try:
        all_rooms = Classroom.query.all()
        free_rooms, unmarked_rooms, occupied_rooms = [], [], []
        
        for room in all_rooms:
            occupancy = (RoomOccupancy.query
                         .filter_by(room_id=room.room_id)
                         .order_by(RoomOccupancy.timestamp.desc())
                         .first())
            
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
                room_info["status"] = "free"
                room_info["last_updated"] = occupancy.timestamp.isoformat()
                free_rooms.append(room_info)
            else:
                room_info["status"] = "occupied"
                room_info["faculty_id"] = occupancy.faculty_id
                room_info["last_updated"] = occupancy.timestamp.isoformat()
                occupied_rooms.append(room_info)
                
        return jsonify({
            "free_rooms": free_rooms, 
            "unmarked_rooms": unmarked_rooms, 
            "occupied_rooms": occupied_rooms
        }), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get room status: {str(e)}"}), 500

@app.route("/teacher/timetable", methods=["GET"])
@token_required
@teacher_required
def teacher_timetable(current_user):
    try:
        faculty_record = current_user.faculty_record
        if not faculty_record:
            return jsonify({
                "error": "No faculty record linked to this user account. Contact admin."
            }), 404
        
        timetable_entries = Timetable.query.filter_by(faculty_id=faculty_record.faculty_id).all()
        result = []
        for e in timetable_entries:
            course = Course.query.get(e.course_id)
            section = Section.query.get(e.section_id)
            room = Classroom.query.get(e.room_id)
            result.append({
                "course": course.name if course else "Unknown",
                "section": section.name if section else "Unknown",
                "room": room.name if room else "Unknown",
                "day": e.day,
                "slot": e.slot,
                "year": course.year if course else None,
                "semester": course.semester if course else None
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get teacher timetable: {str(e)}"}), 500

# -----------------------
# STUDENT ROUTES
# -----------------------
@app.route("/student/timetable", methods=["GET"])
@token_required
def student_timetable(current_user):
    try:
        if current_user.role != "student":
            return jsonify({"error": "Student access required"}), 403
        
        if not current_user.section_id:
            return jsonify({"error": "Student not assigned to any section"}), 400
        
        timetable_entries = Timetable.query.filter_by(section_id=current_user.section_id).all()
        result = []
        for e in timetable_entries:
            course = Course.query.get(e.course_id)
            faculty = Faculty.query.get(e.faculty_id)
            room = Classroom.query.get(e.room_id)
            result.append({
                "course": course.name if course else "Unknown",
                "faculty": faculty.faculty_name if faculty else "Unknown",
                "room": room.name if room else "Unknown",
                "day": e.day,
                "slot": e.slot,
                "year": course.year if course else None,
                "semester": course.semester if course else None
            })
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": f"Failed to get student timetable: {str(e)}"}), 500

# -----------------------
# GENERAL ROUTES
# -----------------------
@app.route("/get_timetable", methods=["GET"])
@token_required
def get_timetable(current_user):
    try:
        dept_name = request.args.get("dept_name")
        year = request.args.get("year", type=int)

        timetable = Timetable.query.all()
        result = []
        faculty_dict = {f.faculty_id: f.faculty_name for f in Faculty.query.all()}
        room_dict = {r.room_id: r.name for r in Classroom.query.all()}

        for t in timetable:
            c = Course.query.get(t.course_id)
            s = Section.query.get(t.section_id)
            if not c or not s:
                continue
                
            if dept_name and c.department and c.department.dept_name != dept_name:
                continue
            if year and c.year != year:
                continue

            result.append({
                "id": t.timetable_id,
                "course": c.name,
                "section": s.name,
                "faculty": faculty_dict.get(t.faculty_id, "Unknown"),
                "room": room_dict.get(t.room_id, "Unknown"),
                "day": t.day,
                "slot": t.slot,
                "year": c.year,
                "semester": c.semester,
                "dept_name": c.department.dept_name if c.department else "Unknown"
            })
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Failed to get timetable: {str(e)}"}), 500

# -----------------------
# CSV GENERATION AND UPLOAD ROUTES
# -----------------------
@app.route("/generate_csvs", methods=["POST"])
@token_required
@admin_required
def generate_csvs(current_user):
    try:
        os.makedirs("data", exist_ok=True)

        # Generate departments.csv
        departments = Department.query.all()
        if departments:
            dept_df = pd.DataFrame([{"id": d.id, "dept_name": d.dept_name} for d in departments])
            dept_df.to_csv("data/departments.csv", index=False)

        # Generate faculty.csv
        faculty = Faculty.query.all()
        if faculty:
            faculty_df = pd.DataFrame([{
                "faculty_name": f.faculty_name,
                "max_hours": f.max_hours,
                "dept_name": f.department.dept_name if f.department else ""
            } for f in faculty])
            faculty_df.to_csv("data/faculty.csv", index=False)

        # Generate courses.csv
        courses = Course.query.all()
        if courses:
            courses_df = pd.DataFrame([{
                "name": c.name,
                "type": c.type,
                "credits": c.credits,
                "year": c.year,
                "semester": c.semester,
                "dept_name": c.department.dept_name if c.department else "",
                "faculty_name": c.faculty.faculty_name if c.faculty else ""
            } for c in courses])
            courses_df.to_csv("data/courses.csv", index=False)

        # Generate classrooms.csv
        rooms = Classroom.query.all()
        if rooms:
            rooms_df = pd.DataFrame([{
                "name": r.name,
                "capacity": r.capacity,
                "resources": r.resources
            } for r in rooms])
            rooms_df.to_csv("data/classrooms.csv", index=False)

        # Generate sections.csv
        sections = Section.query.all()
        if sections:
            sections_df = pd.DataFrame([{
                "dept_name": s.department.dept_name if s.department else "",
                "year": s.year,
                "section": s.name
            } for s in sections])
            sections_df.to_csv("data/sections.csv", index=False)

        # Generate students.csv
        students = User.query.filter_by(role='student').all()
        if students:
            students_df = pd.DataFrame([{
                "username": s.username,
                "dept_name": s.department.dept_name if s.department else "",
                "year": s.year,
                "section_name": s.section.name if s.section else ""
            } for s in students])
            students_df.to_csv("data/students.csv", index=False)

        # Generate timetable.csv
        timetable = Timetable.query.all()
        if timetable:
            timetable_data = []
            for t in timetable:
                course = Course.query.get(t.course_id)
                faculty = Faculty.query.get(t.faculty_id)
                room = Classroom.query.get(t.room_id)
                section = Section.query.get(t.section_id)
                if course and faculty and room and section:
                    timetable_data.append({
                        "course": course.name,
                        "section": section.name,
                        "faculty": faculty.faculty_name,
                        "room": room.name,
                        "day": t.day,
                        "slot": t.slot,
                        "year": course.year,
                        "semester": course.semester,
                        "dept_name": course.department.dept_name if course.department else ""
                    })
            if timetable_data:
                timetable_df = pd.DataFrame(timetable_data)
                timetable_df.to_csv("data/timetable.csv", index=False)

        return jsonify({"message": "CSVs generated successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to generate CSVs: {str(e)}"}), 500

# Upload routes with better error handling
@app.route("/upload/departments", methods=["POST"])
@token_required
@admin_required
def upload_departments(current_user):
    try:
        file = request.files.get("file")
        if not file or not file.filename.endswith('.csv'):
            return jsonify({"error": "Please upload a valid CSV file"}), 400
            
        df = pd.read_csv(file)
        
        if 'dept_name' not in df.columns:
            return jsonify({"error": "CSV must contain 'dept_name' column"}), 400
        
        added_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                dept_name = str(row['dept_name']).strip() if pd.notna(row['dept_name']) else ""
                if dept_name and not Department.query.filter_by(dept_name=dept_name).first():
                    dept = Department(dept_name=dept_name)
                    db.session.add(dept)
                    added_count += 1
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
        
        if added_count > 0:
            db.session.commit()
            
        message = f"Departments uploaded successfully. Added {added_count} new departments."
        if errors:
            message += f" Errors: {'; '.join(errors[:5])}"
            
        return jsonify({"message": message}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to upload departments: {str(e)}"}), 500

@app.route("/upload/faculty", methods=["POST"])
@token_required
@admin_required
def upload_faculty(current_user):
    try:
        file = request.files.get("file")
        if not file or not file.filename.endswith('.csv'):
            return jsonify({"error": "Please upload a valid CSV file"}), 400
            
        df = pd.read_csv(file)
        
        required_cols = ['faculty_name', 'dept_name']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            return jsonify({"error": f"CSV must contain columns: {', '.join(missing_cols)}"}), 400
        
        added_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                faculty_name = str(row['faculty_name']).strip() if pd.notna(row['faculty_name']) else ""
                dept_name = str(row['dept_name']).strip() if pd.notna(row['dept_name']) else ""
                
                if faculty_name and not Faculty.query.filter_by(faculty_name=faculty_name).first():
                    dept = Department.query.filter_by(dept_name=dept_name).first()
                    if dept:
                        faculty = Faculty(
                            faculty_name=faculty_name, 
                            max_hours=row.get('max_hours', 12), 
                            dept_id=dept.id
                        )
                        db.session.add(faculty)
                        added_count += 1
                    else:
                        errors.append(f"Row {index + 1}: Department '{dept_name}' not found")
            except Exception as e:
                errors.append(f"Row {index + 1}: {str(e)}")
        
        if added_count > 0:
            db.session.commit()
            
        message = f"Faculty uploaded successfully. Added {added_count} new faculty members."
        if errors:
            message += f" Errors: {'; '.join(errors[:5])}"
            
        return jsonify({"message": message}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to upload faculty: {str(e)}"}), 500

@app.route("/upload/students", methods=["POST"])
@token_required
@admin_required
def upload_students(current_user):
    try:
        file = request.files.get("file")
        if not file or not file.filename.endswith('.csv'):
            return jsonify({"error": "Please upload a valid CSV file"}), 400

        df = pd.read_csv(file)

        required_cols = ['username', 'password', 'dept_name', 'year', 'section_name']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            return jsonify({"error": f"CSV must contain columns: {', '.join(missing_cols)}"}), 400

        added_count = 0
        errors = []

        for index, row in df.iterrows():
            try:
                username = str(row['username']).strip()
                password = str(row['password']).strip()
                dept_name = str(row['dept_name']).strip()
                year = int(row['year'])
                section_name = str(row['section_name']).strip().upper()

                if not all([username, password, dept_name, year, section_name]):
                    errors.append(f"Row {index + 2}: Missing data")
                    continue
                
                if User.query.filter_by(username=username).first():
                    errors.append(f"Row {index + 2}: Username '{username}' already exists")
                    continue

                dept = Department.query.filter_by(dept_name=dept_name).first()
                if not dept:
                    errors.append(f"Row {index + 2}: Department '{dept_name}' not found")
                    continue

                section = Section.query.filter_by(name=section_name, year=year, dept_id=dept.id).first()
                if not section:
                    errors.append(f"Row {index + 2}: Section '{section_name}' for year {year} in '{dept_name}' not found")
                    continue

                new_student = User(
                    username=username,
                    role='student',
                    dept_id=dept.id,
                    year=year,
                    section_id=section.id
                )
                new_student.set_password(password)
                db.session.add(new_student)
                added_count += 1

            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")

        if added_count > 0:
            db.session.commit()

        message = f"Students uploaded. Added {added_count} new students."
        if errors:
            message += f" Errors occurred on {len(errors)} rows. First 5 errors: {'; '.join(errors[:5])}"

        return jsonify({"message": message}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500

# -----------------------
# MIGRATION AND UTILITY ROUTES
# -----------------------
@app.route("/admin/migrate_user_faculty", methods=["POST"])
@token_required
@admin_required
def migrate_user_faculty(current_user):
    """One-time migration to link existing teachers with faculty records"""
    try:
        teachers = User.query.filter_by(role='teacher').all()
        linked_count = 0
        
        for teacher in teachers:
            faculty = Faculty.query.filter_by(faculty_name=teacher.username).first()
            if faculty and not faculty.user_id:
                faculty.user_id = teacher.id
                db.session.add(faculty)
                linked_count += 1
        
        db.session.commit()
        return jsonify({
            "message": f"Migration completed: {linked_count} teachers linked to faculty records"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Migration failed: {str(e)}"}), 500

# -----------------------
# ERROR HANDLERS
# -----------------------
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

# -----------------------
# MAIN
# -----------------------
if __name__ == "__main__":
    with app.app_context():
        try:
            db.create_all()
            print("Database created successfully!")

            try:
                teachers = User.query.filter_by(role='teacher').all()
                linked_count = 0
                for teacher in teachers:
                    faculty = Faculty.query.filter_by(faculty_name=teacher.username).first()
                    if faculty and not faculty.user_id:
                        faculty.user_id = teacher.id
                        db.session.add(faculty)
                        linked_count += 1
                
                if linked_count > 0:
                    db.session.commit()
                    print(f"Migration completed: Linked {linked_count} teachers to faculty records")
                
            except Exception as e:
                db.session.rollback()
                print(f"Migration failed during startup: {str(e)}")

            load_csv_data()
            create_sample_data()

        except Exception as e:
            print(f"Error during initial database setup: {e}")

    app.run(debug=True, port=5000)

