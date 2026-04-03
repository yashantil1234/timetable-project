from flask import Blueprint, request, jsonify
from extensions import db
from models import Assessment, Grade, User
from utils.decorators import token_required
from datetime import datetime
import csv
import io

marks_bp = Blueprint('marks', __name__)

@marks_bp.route("/marks/upload", methods=["POST", "OPTIONS"])
@token_required
def upload_marks(current_user):
    """
    Upload marks in bulk (JSON or CSV).
    Payload: assessment_id, marks_data (list of dict or CSV file)
    """
    if current_user.role not in ['admin', 'teacher']:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        assessment_id = request.form.get('assessment_id')
        if not assessment_id:
            # Maybe it's a JSON request
            data = request.json
            assessment_id = data.get('assessment_id')
            marks_list = data.get('marks')
        else:
            # CSV/Form upload
            uploaded_file = request.files.get('file')
            if not uploaded_file:
                return jsonify({"error": "No file uploaded or assessment_id missing"}), 400
            
            # Parse CSV
            stream = io.StringIO(uploaded_file.stream.read().decode("UTF8"), newline=None)
            csv_reader = csv.DictReader(stream)
            marks_list = []
            for row in csv_reader:
                # Expecting columns: student_id, marks
                marks_list.append({
                    "student_id": int(row['student_id']),
                    "marks": float(row['marks'])
                })

        if not assessment_id or not marks_list:
            return jsonify({"error": "Invalid data"}), 400

        assessment = Assessment.query.get(assessment_id)
        if not assessment:
            return jsonify({"error": "Assessment not found"}), 404

        processed_count = 0
        errors = []

        # Start transaction
        for entry in marks_list:
            student_id = entry.get('student_id')
            marks_obtained = entry.get('marks')

            if marks_obtained > assessment.max_marks:
                errors.append(f"Student ID {student_id}: Marks {marks_obtained} exceeds max marks {assessment.max_marks}")
                continue

            # Check if student exists
            student = User.query.get(student_id)
            if not student or student.role != 'student':
                errors.append(f"Student ID {student_id} not found or not a student")
                continue

            # Update or create grade
            grade = Grade.query.filter_by(student_id=student_id, assessment_id=assessment_id).first()
            if not grade:
                grade = Grade(
                    student_id=student_id,
                    assessment_id=assessment_id,
                    marks_obtained=marks_obtained,
                    graded_by=current_user.id
                )
                db.session.add(grade)
            else:
                grade.marks_obtained = marks_obtained
                grade.graded_by = current_user.id
                grade.updated_at = datetime.utcnow()

            grade.calculate_percentage()
            grade.assign_grade_letter()
            processed_count += 1

        if errors:
            db.session.rollback()
            return jsonify({
                "error": "Some marks could not be uploaded",
                "details": errors
            }), 400

        db.session.commit()
        return jsonify({
            "message": f"Successfully uploaded marks for {processed_count} students",
            "count": processed_count
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@marks_bp.route("/student/marks", methods=["GET", "OPTIONS"])
@token_required
def get_student_marks(current_user):
    """View marks for current student"""
    if current_user.role != 'student':
        return jsonify({"error": "Unauthorized"}), 403

    try:
        grades = Grade.query.filter_by(student_id=current_user.id).all()
        
        results = []
        for g in grades:
            results.append({
                "id": g.id,
                "course": g.assessment.course.name if g.assessment and g.assessment.course else "Unknown",
                "assessment": g.assessment.title if g.assessment else "Unknown",
                "marks_obtained": g.marks_obtained,
                "total_marks": g.assessment.max_marks if g.assessment else 0,
                "percentage": g.percentage,
                "grade": g.grade_letter,
                "date": g.assessment.scheduled_date.isoformat() if g.assessment else None
            })
            
        return jsonify({"marks": results}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
