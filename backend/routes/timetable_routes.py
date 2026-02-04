"""
Timetable routes - Generation and viewing
"""

from flask import Blueprint, request, jsonify, make_response
from extensions import db
from models import Timetable
from services.scheduler_service import generate_timetable_internal
from utils.decorators import token_required

timetable_bp = Blueprint('timetable', __name__)




@timetable_bp.route("/get_timetable", methods=["GET", "OPTIONS"])
def get_timetable():
    try:
        dept_name = request.args.get("dept_name")
        year = request.args.get("year")
        section_name = request.args.get("section")

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
                "faculty": t.faculty.faculty_name if t.faculty else "N/A",
                "room": t.room.name,
                "day": t.day,
                "start_time": t.start_time,
                "department": t.course.department.dept_name,
                "year": t.section.year,
                "credits": t.course.credits,
                "type": t.course.type
            })

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@timetable_bp.route("/teacher/timetable", methods=["GET", "OPTIONS"])
@token_required
def teacher_timetable(current_user):
    from models import Faculty
    if current_user.role != "teacher":
        return jsonify({"error": "Unauthorized - Teachers only"}), 403

    try:
        faculty = Faculty.query.filter_by(faculty_name=current_user.full_name, dept_id=current_user.dept_id).first()
        if not faculty:
            faculty = Faculty.query.filter(
                Faculty.faculty_name.contains(current_user.full_name.split()[-1]),
                Faculty.dept_id == current_user.dept_id
            ).first()
        if not faculty:
            faculty = Faculty(
                faculty_name=current_user.full_name,
                max_hours=12,
                dept_id=current_user.dept_id
            )
            db.session.add(faculty)
            db.session.commit()

        timetable_entries = Timetable.query.filter_by(faculty_id=faculty.faculty_id).all()
        result = [{
            "id": e.timetable_id,
            "course": e.course.name,
            "section": f"{e.section.name} (Year {e.section.year})",
            "room": e.room.name,
            "day": e.day,
            "start_time": e.start_time,
            "slot": e.start_time,
            "department": e.course.department.dept_name
        } for e in timetable_entries]

        return jsonify({
            "timetable": result,
            "teacher_name": current_user.full_name,
            "department": current_user.department.dept_name if current_user.department else None
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@timetable_bp.route("/student/timetable", methods=["GET", "OPTIONS"])
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
            "faculty": e.faculty.faculty_name if e.faculty else "N/A",
            "room": e.room.name,
            "day": e.day,
            "start_time": e.start_time,
            "type": e.course.type,
            "credits": e.course.credits
        } for e in timetable_entries]
        
        return jsonify({
            "timetable": result,
            "section": current_user.section.name if current_user.section else None,
            "year": current_user.year
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
