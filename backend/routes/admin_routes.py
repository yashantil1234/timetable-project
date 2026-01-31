"""
Admin routes - All admin-only endpoints
"""

from datetime import datetime
from flask import Blueprint, request, jsonify, make_response
from extensions import db
from models import (
    Department, Faculty, Course, Classroom, Section, User,
    FacultyUnavailability, SwapRequest, LeaveRequest, SystemAnnouncement
)
from utils.decorators import token_required, admin_required
from utils.export_utils import export_csvs

admin_bp = Blueprint('admin', __name__)

# Handle OPTIONS for all admin routes
@admin_bp.before_request
def handle_options():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-access-token,X-Requested-With,Accept')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response


@admin_bp.route("/departments", methods=["GET", "POST", "OPTIONS"])
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


@admin_bp.route("/faculty", methods=["GET", "POST", "OPTIONS"])
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
                email=data.get("email", "").strip() if data.get("email") else None
            )
            db.session.add(faculty)
            db.session.commit()
            export_csvs()
            return jsonify({"message": "Faculty added successfully!", "faculty_id": faculty.faculty_id})
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to add faculty: {str(e)}"}), 500


@admin_bp.route("/courses", methods=["GET", "POST", "OPTIONS"])
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
                    "hours_per_week": c.hours_per_week,
                    "year": c.year,
                    "semester": c.semester,
                    "dept_name": c.department.dept_name if c.department else None,
                    "faculty_name": c.faculty.faculty_name if c.faculty else None,
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
            
            is_fixed = data.get("is_fixed", False)
            fixed_day = data.get("fixed_day")
            fixed_slot = data.get("fixed_slot")
            fixed_room_id = data.get("fixed_room_id")

            if is_fixed:
                if not all([fixed_day, fixed_slot, fixed_room_id]):
                    return jsonify({"error": "For a fixed class, 'fixed_day', 'fixed_slot', and 'fixed_room_id' are required."}), 400
                if not Classroom.query.get(fixed_room_id):
                    return jsonify({"error": f"Fixed room with ID {fixed_room_id} not found."}), 404

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
                hours_per_week=data.get("hours_per_week", 4),
                dept_id=dept.id,
                faculty_id=faculty_id,
                year=data["year"],
                semester=data["semester"],
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
                    "hours_per_week": new_course.hours_per_week,
                    "dept_name": dept.dept_name,
                    "faculty_id": new_course.faculty_id,
                    "year": new_course.year,
                    "semester": new_course.semester,
                    "is_fixed": new_course.is_fixed,
                    "fixed_day": new_course.fixed_day,
                    "fixed_slot": new_course.fixed_slot,
                    "fixed_room_id": new_course.fixed_room_id
                }
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to create course: {str(e)}"}), 500


@admin_bp.route("/rooms", methods=["GET", "POST", "OPTIONS"])
@token_required
@admin_required
def admin_rooms(current_user):
    from models import Classroom
    from utils.export_utils import export_csvs
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
            return jsonify({"error": str(e)}), 500
    else:
        try:
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


@admin_bp.route("/sections", methods=["GET", "POST", "OPTIONS"])
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
                for ch in [chr(i) for i in range(65, 91)]:  # A-Z
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


@admin_bp.route("/students", methods=["GET", "POST", "OPTIONS"])
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


@admin_bp.route("/students/<int:student_id>", methods=["GET", "PUT", "DELETE", "OPTIONS"])
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


@admin_bp.route("/students/delete_bulk", methods=["POST", "OPTIONS"])
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


@admin_bp.route("/faculty/<int:faculty_id>/unavailability", methods=["GET", "POST"])
@token_required
@admin_required
def manage_faculty_unavailability(current_user, faculty_id):
    faculty = Faculty.query.get_or_404(faculty_id)

    if request.method == "GET":
        try:
            slots = FacultyUnavailability.query.filter_by(faculty_id=faculty.faculty_id).all()
            return jsonify([
                {"id": s.id, "day": s.day, "start_time": s.start_time} for s in slots
            ])
        except Exception as e:
            return jsonify({"error": f"Failed to fetch unavailable slots: {str(e)}"}), 500

    if request.method == "POST":
        try:
            data = request.json
            if not data or not data.get("day") or not data.get("start_time"):
                return jsonify({"error": "Day and start_time are required"}), 400

            day = data["day"]
            start_time = data["start_time"]

            existing = FacultyUnavailability.query.filter_by(
                faculty_id=faculty.faculty_id,
                day=day,
                start_time=start_time
            ).first()
            if existing:
                return jsonify({"error": "This unavailability slot already exists for this faculty."}), 400

            new_slot = FacultyUnavailability(
                faculty_id=faculty.faculty_id,
                day=day,
                start_time=start_time
            )
            db.session.add(new_slot)
            db.session.commit()

            return jsonify({
                "message": f"Unavailability added for {faculty.faculty_name}",
                "slot": {"id": new_slot.id, "day": new_slot.day, "start_time": new_slot.start_time}
            }), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to add unavailability: {str(e)}"}), 500


@admin_bp.route("/unavailability/<int:slot_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_unavailability(current_user, slot_id):
    slot = FacultyUnavailability.query.get_or_404(slot_id)
    try:
        db.session.delete(slot)
        db.session.commit()
        return jsonify({"message": "Unavailability slot deleted successfully."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete slot: {str(e)}"}), 500


@admin_bp.route("/swap-requests", methods=["GET"])
@token_required
@admin_required
def admin_get_swap_requests(current_user):
    status_filter = request.args.get('status', 'pending')
    requests = SwapRequest.query.filter_by(status=status_filter).all()
    
    return jsonify([{
        "id": r.id,
        "requesting_faculty": r.requesting_faculty.faculty_name,
        "course_name": r.original_timetable_entry.course.name,
        "section_name": r.original_timetable_entry.section.name,
        "original_day": r.original_timetable_entry.day,
        "original_start_time": r.original_timetable_entry.start_time,
        "proposed_day": r.proposed_day,
        "proposed_start_time": r.proposed_start_time,
        "status": r.status,
        "reason": r.reason,
        "created_at": r.created_at.isoformat()
    } for r in requests])


@admin_bp.route("/swap-requests/<int:request_id>/approve", methods=["POST"])
@token_required
@admin_required
def admin_approve_swap(current_user, request_id):
    from utils.timetable_utils import check_for_conflict
    swap_request = SwapRequest.query.get_or_404(request_id)
    if swap_request.status != 'pending':
        return jsonify({"error": f"This request has already been {swap_request.status}."}), 400

    timetable_entry = swap_request.original_timetable_entry
    
    conflict_reason = check_for_conflict(timetable_entry, swap_request.proposed_day, swap_request.proposed_start_time)
    if conflict_reason:
        return jsonify({"error": f"Approval failed. Conflict found: {conflict_reason}"}), 409

    timetable_entry.day = swap_request.proposed_day
    timetable_entry.start_time = swap_request.proposed_start_time
    
    swap_request.status = 'approved'
    swap_request.admin_notes = f"Approved by {current_user.username}."
    
    db.session.commit()
    
    return jsonify({"message": "Swap request approved and timetable updated."})


@admin_bp.route("/swap-requests/<int:request_id>/reject", methods=["POST"])
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
    
    return jsonify({"message": "Swap request has been rejected."})


@admin_bp.route("/leave-requests", methods=["GET"])
@token_required
@admin_required
def admin_get_leave_requests(current_user):
    try:
        status_filter = request.args.get("status", "pending")
        dept_filter = request.args.get("department")
        leave_type_filter = request.args.get("leave_type")
        
        query = LeaveRequest.query
        if status_filter:
            query = query.filter_by(status=status_filter)
        if leave_type_filter:
            query = query.filter_by(leave_type=leave_type_filter)
        
        requests = query.order_by(LeaveRequest.created_at.desc()).all()
        
        result = []
        for req in requests:
            user = req.user
            if dept_filter and user.department and user.department.dept_name != dept_filter:
                continue
            
            result.append({
                "id": req.id,
                "user_id": req.user_id,
                "username": user.username,
                "full_name": user.full_name,
                "department": user.department.dept_name if user.department else None,
                "leave_type": req.leave_type,
                "start_date": req.start_date.isoformat(),
                "end_date": req.end_date.isoformat(),
                "reason": req.reason,
                "status": req.status,
                "admin_notes": req.admin_notes,
                "created_at": req.created_at.isoformat(),
                "days_requested": (req.end_date - req.start_date).days + 1
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch leave requests: {str(e)}"}), 500


@admin_bp.route("/leave-requests/<int:request_id>", methods=["GET"])
@token_required
@admin_required
def admin_get_leave_request_details(current_user, request_id):
    try:
        leave_request = LeaveRequest.query.get_or_404(request_id)
        return jsonify({
            "id": leave_request.id,
            "user": {
                "id": leave_request.user.id,
                "username": leave_request.user.username,
                "full_name": leave_request.user.full_name,
                "department": leave_request.user.department.dept_name if leave_request.user.department else None
            },
            "leave_type": leave_request.leave_type,
            "start_date": leave_request.start_date.isoformat(),
            "end_date": leave_request.end_date.isoformat(),
            "reason": leave_request.reason,
            "status": leave_request.status,
            "admin_notes": leave_request.admin_notes,
            "created_at": leave_request.created_at.isoformat(),
            "updated_at": leave_request.updated_at.isoformat(),
            "days_requested": (leave_request.end_date - leave_request.start_date).days + 1
        })
    except Exception as e:
        return jsonify({"error": f"Failed to fetch leave request: {str(e)}"}), 500


@admin_bp.route("/leave-requests/<int:request_id>/approve", methods=["POST"])
@token_required
@admin_required
def admin_approve_leave_request(current_user, request_id):
    try:
        leave_request = LeaveRequest.query.get_or_404(request_id)
        if leave_request.status != "pending":
            return jsonify({"error": "Only pending requests can be approved"}), 400
        
        data = request.json or {}
        leave_request.status = "approved"
        leave_request.approved_by = current_user.id
        leave_request.admin_notes = data.get("admin_notes", f"Approved by {current_user.username}")
        leave_request.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "message": "Leave request approved successfully",
            "request_id": leave_request.id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to approve leave request: {str(e)}"}), 500


@admin_bp.route("/leave-requests/<int:request_id>/reject", methods=["POST"])
@token_required
@admin_required
def admin_reject_leave_request(current_user, request_id):
    try:
        leave_request = LeaveRequest.query.get_or_404(request_id)
        if leave_request.status != "pending":
            return jsonify({"error": "Only pending requests can be rejected"}), 400
        
        data = request.json or {}
        leave_request.status = "rejected"
        leave_request.admin_notes = data.get("admin_notes", f"Rejected by {current_user.username}")
        leave_request.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            "message": "Leave request rejected",
            "request_id": leave_request.id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to reject leave request: {str(e)}"}), 500


@admin_bp.route("/leave-requests/stats", methods=["GET"])
@token_required
@admin_required
def admin_get_leave_stats(current_user):
    try:
        total = LeaveRequest.query.count()
        pending = LeaveRequest.query.filter_by(status="pending").count()
        approved = LeaveRequest.query.filter_by(status="approved").count()
        rejected = LeaveRequest.query.filter_by(status="rejected").count()
        
        return jsonify({
            "total": total,
            "pending": pending,
            "approved": approved,
            "rejected": rejected
        })
    except Exception as e:
        return jsonify({"error": f"Failed to fetch leave stats: {str(e)}"}), 500


@admin_bp.route("/leave-requests/bulk-action", methods=["POST"])
@token_required
@admin_required
def admin_bulk_leave_action(current_user):
    try:
        data = request.json
        action = data.get("action")  # "approve" or "reject"
        request_ids = data.get("request_ids", [])
        
        if action not in ["approve", "reject"]:
            return jsonify({"error": "Action must be 'approve' or 'reject'"}), 400
        
        if not request_ids:
            return jsonify({"error": "No request IDs provided"}), 400
        
        requests = LeaveRequest.query.filter(
            LeaveRequest.id.in_(request_ids),
            LeaveRequest.status == "pending"
        ).all()
        
        updated_count = 0
        for req in requests:
            req.status = action + "d"  # "approved" or "rejected"
            req.approved_by = current_user.id
            req.admin_notes = f"Bulk {action}d by {current_user.username}"
            req.updated_at = datetime.utcnow()
            updated_count += 1
        
        db.session.commit()
        
        return jsonify({
            "message": f"Successfully {action}d {updated_count} leave request(s)"
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to perform bulk action: {str(e)}"}), 500
