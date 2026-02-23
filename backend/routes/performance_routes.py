"""
Performance Management Routes
Handles assessments, grading, and student performance analytics
"""

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from extensions import db
from models import Assessment, Grade, StudentPerformance, Course, User, Department, Section
from utils.decorators import token_required, teacher_required
from datetime import datetime, date
from sqlalchemy import func

performance_bp = Blueprint('performance', __name__)


# ========== TEACHER ENDPOINTS ==========

@performance_bp.route("/assessments", methods=["GET", "POST", "OPTIONS"])
@token_required
@teacher_required
def manage_assessments(current_user):
    """Get all assessments or create a new assessment"""
    try:
        if request.method == "POST":
            data = request.json
            
            # Validate required fields
            required = ["course_id", "title", "assessment_type", "max_marks", "scheduled_date"]
            if not all(key in data for key in required):
                return jsonify({"error": f"Missing required fields: {', '.join(required)}"}), 400
            
            # Parse date
            scheduled_date = datetime.strptime(data['scheduled_date'], '%Y-%m-%d').date()
            
            # Create assessment
            assessment = Assessment(
                course_id=data['course_id'],
                title=data['title'],
                assessment_type=data['assessment_type'],
                max_marks=data['max_marks'],
                weightage=data.get('weightage', 0.0),
                scheduled_date=scheduled_date,
                scheduled_time=data.get('scheduled_time'),
                duration_minutes=data.get('duration_minutes', 60),
                location=data.get('location'),
                created_by=current_user.id
            )
            
            db.session.add(assessment)
            db.session.commit()
            
            return jsonify({
                "message": "Assessment created successfully",
                "assessment": assessment.to_dict()
            }), 201
        
        else:  # GET
            # Get assessments created by this teacher
            # Option: filter by course_id if provided
            course_id = request.args.get('course_id', type=int)
            
            query = Assessment.query.filter_by(created_by=current_user.id)
            
            if course_id:
                query = query.filter_by(course_id=course_id)
            
            assessments = query.order_by(Assessment.scheduled_date.desc()).all()
            
            return jsonify([a.to_dict() for a in assessments]), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@performance_bp.route("/assessments/<int:assessment_id>", methods=["GET", "PUT", "DELETE", "OPTIONS"])
@token_required
@teacher_required
def manage_single_assessment(current_user, assessment_id):
    """Get, update, or delete a specific assessment"""
    try:
        assessment = Assessment.query.get(assessment_id)
        if not assessment:
            return jsonify({"error": "Assessment not found"}), 404
        
        # Check if user created this assessment
        if assessment.created_by != current_user.id and current_user.role != "admin":
            return jsonify({"error": "Unauthorized"}), 403
        
        if request.method == "GET":
            return jsonify(assessment.to_dict()), 200
        
        elif request.method == "DELETE":
            db.session.delete(assessment)
            db.session.commit()
            return jsonify({"message": "Assessment deleted successfully"}), 200
        
        else:  # PUT
            data = request.json
            
            if 'title' in data:
                assessment.title = data['title']
            if 'assessment_type' in data:
                assessment.assessment_type = data['assessment_type']
            if 'max_marks' in data:
                assessment.max_marks = data['max_marks']
            if 'weightage' in data:
                assessment.weightage = data['weightage']
            if 'scheduled_date' in data:
                assessment.scheduled_date = datetime.strptime(data['scheduled_date'], '%Y-%m-%d').date()
            if 'scheduled_time' in data:
                assessment.scheduled_time = data['scheduled_time']
            if 'duration_minutes' in data:
                assessment.duration_minutes = data['duration_minutes']
            if 'location' in data:
                assessment.location = data['location']
            if 'status' in data:
                assessment.status = data['status']
            
            assessment.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                "message": "Assessment updated successfully",
                "assessment": assessment.to_dict()
            }), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@performance_bp.route("/grades", methods=["POST", "OPTIONS"])
@token_required
@teacher_required
def enter_grades(current_user):
    """Enter or update grades for multiple students"""
    try:
        data = request.json
        grades_data = data.get('grades', [])
        
        if not grades_data:
            return jsonify({"error": "No grades provided"}), 400
        
        created_count = 0
        updated_count = 0
        
        for grade_entry in grades_data:
            student_id = grade_entry.get('student_id')
            assessment_id = grade_entry.get('assessment_id')
            marks_obtained = grade_entry.get('marks_obtained')
            
            if not all([student_id, assessment_id, marks_obtained is not None]):
                continue
            
            # Check if grade already exists
            existing_grade = Grade.query.filter_by(
                student_id=student_id,
                assessment_id=assessment_id
            ).first()
            
            if existing_grade:
                # Update existing grade
                existing_grade.marks_obtained = marks_obtained
                existing_grade.remarks = grade_entry.get('remarks', '')
                existing_grade.calculate_percentage()
                existing_grade.assign_grade_letter()
                existing_grade.graded_by = current_user.id
                existing_grade.updated_at = datetime.utcnow()
                updated_count += 1
            else:
                # Create new grade
                new_grade = Grade(
                    student_id=student_id,
                    assessment_id=assessment_id,
                    marks_obtained=marks_obtained,
                    remarks=grade_entry.get('remarks', ''),
                    graded_by=current_user.id
                )
                new_grade.calculate_percentage()
                new_grade.assign_grade_letter()
                db.session.add(new_grade)
                created_count += 1
            
            # Update student performance metrics
            assessment = Assessment.query.get(assessment_id)
            if assessment:
                update_student_performance(student_id, assessment.course_id)
        
        db.session.commit()
        
        return jsonify({
            "message": f"Grades processed: {created_count} created, {updated_count} updated",
            "created": created_count,
            "updated": updated_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@performance_bp.route("/grades/assessment/<int:assessment_id>", methods=["GET", "OPTIONS"])
@token_required
@teacher_required
def get_grades_for_assessment(current_user, assessment_id):
    """Get all grades for a specific assessment"""
    try:
        assessment = Assessment.query.get(assessment_id)
        if not assessment:
            return jsonify({"error": "Assessment not found"}), 404
        
        grades = Grade.query.filter_by(assessment_id=assessment_id).all()
        
        return jsonify({
            "assessment": assessment.to_dict(),
            "grades": [g.to_dict() for g in grades]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@performance_bp.route("/performance/course/<int:course_id>", methods=["GET", "OPTIONS"])
@token_required
@teacher_required
def get_course_performance(current_user, course_id):
    """Get performance overview for a course"""
    try:
        course = Course.query.get(course_id)
        if not course:
            return jsonify({"error": "Course not found"}), 404
        
        # Get all students in this course (via timetable/section)
        # Simplified: get performance records
        performance_records = StudentPerformance.query.filter_by(
            course_id=course_id
        ).all()
        
        # Get course statistics
        total_students = len(performance_records)
        at_risk_students = len([p for p in performance_records if p.at_risk])
        
        avg_attendance = sum(p.total_attendance_percentage for p in performance_records) / total_students if total_students > 0 else 0
        avg_grade = sum(p.average_percentage for p in performance_records) / total_students if total_students > 0 else 0
        
        return jsonify({
            "course_id": course_id,
            "course_name": course.name,
            "total_students": total_students,
            "at_risk_students": at_risk_students,
            "average_attendance": round(avg_attendance, 2),
            "average_grade": round(avg_grade, 2),
            "performance_records": [p.to_dict() for p in performance_records]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ========== STUDENT ENDPOINTS ==========

@performance_bp.route("/student/assessments/upcoming", methods=["GET", "OPTIONS"])
@token_required
def get_upcoming_assessments(current_user):
    """Get upcoming assessments for logged-in student"""
    if current_user.role != "student":
        return jsonify({"error": "Student access only"}), 403
    
    try:
        # Get student's courses (simplified - you may need to adjust based on your schema)
        # For now, get all assessments for student's year and department
        today = date.today()
        
        # Get assessments from courses in student's department and year
        assessments = db.session.query(Assessment).join(Course).filter(
            Course.dept_id == current_user.dept_id,
            Course.year == current_user.year,
            Assessment.scheduled_date >= today,
            Assessment.status == 'scheduled'
        ).order_by(Assessment.scheduled_date).all()
        
        return jsonify([a.to_dict() for a in assessments]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@performance_bp.route("/student/grades", methods=["GET", "OPTIONS"])
@token_required
def get_student_grades(current_user):
    """Get all grades for logged-in student"""
    if current_user.role != "student":
        return jsonify({"error": "Student access only"}), 403
    
    try:
        # Option: filter by course_id
        course_id = request.args.get('course_id', type=int)
        
        query = db.session.query(Grade).filter_by(student_id=current_user.id)
        
        if course_id:
            query = query.join(Assessment).filter(Assessment.course_id == course_id)
        
        grades = query.all()
        
        return jsonify([g.to_dict() for g in grades]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@performance_bp.route("/student/performance", methods=["GET", "OPTIONS"])
@token_required
def get_student_performance(current_user):
    """Get overall performance dashboard for logged-in student"""
    if current_user.role != "student":
        return jsonify({"error": "Student access only"}), 403
    
    try:
        # Get all performance records for this student
        performance_records = StudentPerformance.query.filter_by(
            student_id=current_user.id
        ).all()
        
        # Calculate overall statistics
        if performance_records:
            overall_attendance = sum(p.total_attendance_percentage for p in performance_records) / len(performance_records)
            overall_grade = sum(p.average_percentage for p in performance_records) / len(performance_records)
        else:
            overall_attendance = 0
            overall_grade = 0
        
        return jsonify({
            "student_info": {
                "name": current_user.full_name,
                "roll_number": current_user.roll_number,
                "year": current_user.year,
                "department_id": current_user.dept_id
            },
            "overall_attendance": round(overall_attendance, 2),
            "overall_grade": round(overall_grade, 2),
            "courses": [p.to_dict() for p in performance_records]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@performance_bp.route("/student/performance/course/<int:course_id>", methods=["GET", "OPTIONS"])
@token_required
def get_student_course_performance(current_user, course_id):
    """Get performance for a specific course"""
    if current_user.role != "student":
        return jsonify({"error": "Student access only"}), 403
    
    try:
        performance = StudentPerformance.query.filter_by(
            student_id=current_user.id,
            course_id=course_id
        ).first()
        
        if not performance:
            return jsonify({"error": "Performance record not found"}), 404
        
        # Get all grades for this course
        grades = db.session.query(Grade).join(Assessment).filter(
            Grade.student_id == current_user.id,
            Assessment.course_id == course_id
        ).all()
        
        return jsonify({
            "performance": performance.to_dict(),
            "grades": [g.to_dict() for g in grades]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ========== ADMIN ENDPOINTS ==========

@performance_bp.route("/admin/performance/analytics", methods=["GET", "OPTIONS"])
@token_required
def admin_performance_analytics(current_user):
    """System-wide performance analytics"""
    if current_user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        # Get all performance records
        all_performance = StudentPerformance.query.all()
        
        # Calculate statistics
        total_students = len(set(p.student_id for p in all_performance))
        total_courses = len(set(p.course_id for p in all_performance))
        at_risk_count = len([p for p in all_performance if p.at_risk])
        
        avg_attendance = sum(p.total_attendance_percentage for p in all_performance) / len(all_performance) if all_performance else 0
        avg_performance = sum(p.average_percentage for p in all_performance) / len(all_performance) if all_performance else 0
        
        return jsonify({
            "total_students": total_students,
            "total_courses": total_courses,
            "at_risk_students": at_risk_count,
            "average_attendance": round(avg_attendance, 2),
            "average_performance": round(avg_performance, 2),
            "recent_records": [p.to_dict() for p in all_performance[:20]]  # Latest 20
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@performance_bp.route("/admin/students/at-risk", methods=["GET", "OPTIONS"])
@token_required
def get_at_risk_students(current_user):
    """Get list of at-risk students"""
    if current_user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        at_risk_performance = StudentPerformance.query.filter_by(at_risk=True).all()
        
        # Group by student
        at_risk_students = {}
        for perf in at_risk_performance:
            if perf.student_id not in at_risk_students:
                at_risk_students[perf.student_id] = {
                    "student_id": perf.student_id,
                    "student_name": perf.student.full_name if perf.student else "Unknown",
                    "courses": []
                }
            
            at_risk_students[perf.student_id]["courses"].append({
                "course_name": perf.course.name if perf.course else "Unknown",
                "attendance": perf.total_attendance_percentage,
                "average_grade": perf.average_percentage
            })
        
        return jsonify(list(at_risk_students.values())), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ========== HELPER FUNCTIONS ==========

def update_student_performance(student_id, course_id):
    """Update or create performance record for a student-course combination"""
    performance = StudentPerformance.query.filter_by(
        student_id=student_id,
        course_id=course_id
    ).first()
    
    if not performance:
        performance = StudentPerformance(
            student_id=student_id,
            course_id=course_id,
            year=datetime.now().year
        )
        db.session.add(performance)
    
    performance.update_metrics()
    db.session.commit()
