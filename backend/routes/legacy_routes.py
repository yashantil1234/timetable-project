"""
Legacy routes for backward compatibility
"""

from flask import Blueprint, request, jsonify, make_response
from extensions import db
from models import Department, Section, Faculty, Course, Classroom, CourseAllocation
from utils.export_utils import export_csvs

legacy_bp = Blueprint('legacy', __name__)

# Handle OPTIONS for all legacy routes
@legacy_bp.before_request
def handle_options():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-access-token,X-Requested-With,Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response


@legacy_bp.route("/add_department", methods=["GET", "POST", "OPTIONS"])
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
        
        export_csvs()
        
        return jsonify({"message": "Department added", "dept_name": dept.dept_name}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@legacy_bp.route("/get_departments", methods=["GET", "OPTIONS"])
def get_departments():
    try:
        depts = Department.query.all()
        return jsonify([{"id": d.id, "dept_name": d.dept_name} for d in depts])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@legacy_bp.route("/add_section", methods=["GET", "POST", "OPTIONS"])
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
        
        export_csvs()
        
        return jsonify({"message": "Section added", "section_id": section.id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@legacy_bp.route("/get_sections", methods=["GET", "OPTIONS"])
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


@legacy_bp.route("/add_faculty", methods=["GET", "POST", "OPTIONS"])
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
        
        export_csvs()
        
        return jsonify({"message": "Faculty added successfully!", "faculty_id": faculty.faculty_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@legacy_bp.route("/get_faculty", methods=["GET", "OPTIONS"])
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


@legacy_bp.route("/add_course", methods=["GET", "POST", "OPTIONS"])
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
            credits=data.get("credits", 0),
            year=data["year"],
            semester=data["semester"],
            dept_id=dept.id,
            faculty_id=data["faculty_id"]
        )
        db.session.add(course)
        db.session.commit()
        
        export_csvs()
        
        return jsonify({"message": "Course added", "course_id": course.course_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@legacy_bp.route("/get_courses", methods=["GET", "OPTIONS"])
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
        return jsonify([{
            "id": c.course_id,
            "name": c.name,
            "type": c.type,
            "credits": c.credits,
            "year": c.year,
            "semester": c.semester,
            "dept_name": c.department.dept_name,
            "faculty_name": c.faculty.faculty_name if c.faculty else None
        } for c in courses])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@legacy_bp.route("/add_room", methods=["GET", "POST", "OPTIONS"])
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
        
        export_csvs()
        
        return jsonify({"message": "Room added", "room_id": room.room_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@legacy_bp.route("/get_rooms", methods=["GET", "OPTIONS"])
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


@legacy_bp.route("/set_course_allocation", methods=["GET", "POST", "OPTIONS"])
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
        
        export_csvs()
        
        return jsonify({"message": "Course allocation set successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@legacy_bp.route("/get_course_allocations", methods=["GET", "OPTIONS"])
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


@legacy_bp.route("/generate_csvs", methods=["GET", "POST", "OPTIONS"])
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
