from flask import Blueprint, request, jsonify
from extensions import db
from models import Assessment, Course, User
from utils.decorators import token_required
from datetime import datetime

assessment_bp = Blueprint('assessment', __name__)

@assessment_bp.route("/assessments", methods=["GET", "POST", "OPTIONS"])
@token_required
def handle_assessments(current_user):
    """Teacher Dashboard: List/Create Assessments"""
    try:
        if request.method == "POST":
            if current_user.role not in ['admin', 'teacher']:
                return jsonify({"error": "Unauthorized"}), 403
            
            data = request.json
            course_id = data.get('course_id')
            title = data.get('title')
            assessment_type = data.get('assessment_type', 'quiz')
            max_marks = data.get('max_marks')
            scheduled_date_str = data.get('scheduled_date') # YYYY-MM-DD
            
            if not all([course_id, title, max_marks, scheduled_date_str]):
                return jsonify({"error": "Missing required fields"}), 400
            
            scheduled_date = datetime.strptime(scheduled_date_str, '%Y-%m-%d').date()
            
            new_assessment = Assessment(
                course_id=course_id,
                title=title,
                assessment_type=assessment_type,
                max_marks=float(max_marks),
                scheduled_date=scheduled_date,
                created_by=current_user.id
            )
            
            db.session.add(new_assessment)
            db.session.commit()
            
            return jsonify({
                "message": "Assessment created",
                "assessment": new_assessment.to_dict()
            }), 201
            
        else: # GET
            # Filter by course if provided
            course_id = request.args.get('course_id')
            
            query = Assessment.query
            if course_id:
                query = query.filter_by(course_id=course_id)
            
            # If teacher, show their assessments
            if current_user.role == 'teacher':
                query = query.filter_by(created_by=current_user.id)
                
            assessments = query.order_by(Assessment.scheduled_date.desc()).all()
            
            return jsonify({
                "assessments": [a.to_dict() for a in assessments]
            }), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@assessment_bp.route("/teacher/students", methods=["GET"])
@token_required
def teacher_get_students(current_user):
    """Fetch students for a specific course (Teacher only)"""
    if current_user.role not in ['admin', 'teacher']:
        return jsonify({"error": "Unauthorized"}), 403
        
    course_id = request.args.get('course_id')
    if not course_id:
        # If no course_id, return all students in teacher's department
        students = User.query.filter_by(role='student', dept_id=current_user.dept_id).all()
    else:
        course = Course.query.get(course_id)
        if not course:
            return jsonify({"error": "Course not found"}), 404
            
        # Get students in the same department and year as the course
        students = User.query.filter_by(
            role='student', 
            dept_id=course.dept_id,
            year=course.year
        ).all()
        
    return jsonify({
        "students": [{
            "id": s.id,
            "full_name": s.full_name,
            "username": s.username,
            "roll_number": s.username # Assuming username is roll number
        } for s in students]
    }), 200

@assessment_bp.route("/teacher/my-courses", methods=["GET"])
@token_required
def get_teacher_my_courses(current_user):
    """Reliably fetch courses assigned to the logged-in teacher"""
    if current_user.role not in ['admin', 'teacher']:
        return jsonify({"error": "Unauthorized"}), 403
        
    try:
        from models import Faculty, Course
        
        # 1. Resolve Faculty record
        faculty = Faculty.query.filter_by(
            faculty_name=current_user.full_name,
            dept_id=current_user.dept_id
        ).first()
        
        if not faculty:
            # Try partial name match
            faculty = Faculty.query.filter(
                Faculty.faculty_name.contains(current_user.full_name.split()[-1]),
                Faculty.dept_id == current_user.dept_id
            ).first()
            
        if not faculty:
            return jsonify({"error": "Faculty record not found for this user", "courses": []}), 200
            
        # 2. Get courses assigned directly in Course table
        courses = Course.query.filter_by(faculty_id=faculty.faculty_id).all()
        
        return jsonify({
            "courses": [{
                "id": c.course_id,
                "name": c.name,
                "dept_id": c.dept_id,
                "year": c.year
            } for c in courses]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@assessment_bp.route("/assessments/<int:assessment_id>", methods=["GET", "DELETE", "OPTIONS"])
@token_required
def handle_assessment_detail(current_user, assessment_id):
    """Get or Delete Assessment"""
    try:
        assessment = Assessment.query.get(assessment_id)
        if not assessment:
            return jsonify({"error": "Assessment not found"}), 404
            
        if request.method == "DELETE":
            if current_user.role not in ['admin', 'teacher'] or \
               (current_user.role == 'teacher' and assessment.created_by != current_user.id):
                return jsonify({"error": "Unauthorized"}), 403
                
            db.session.delete(assessment)
            db.session.commit()
            return jsonify({"message": "Assessment deleted"}), 200
            
        else: # GET
            return jsonify(assessment.to_dict()), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
