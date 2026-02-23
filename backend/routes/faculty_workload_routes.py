"""
Faculty Workload Management Routes
Handles workload tracking, meeting scheduling, and analytics
"""

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from extensions import db
from models import Faculty, FacultyWorkload, Meeting, FacultyMeetingParticipation, Timetable, User
from utils.decorators import token_required, teacher_required
from datetime import datetime, timedelta
from sqlalchemy import func, and_

workload_bp = Blueprint('workload', __name__)


def get_week_number_and_year(date=None):
    """Get ISO week number and year for a given date"""
    if date is None:
        date = datetime.now()
    iso_calendar = date.isocalendar()
    return iso_calendar[1], iso_calendar[0]  # week_number, year


def calculate_teaching_hours_for_week(faculty_id, week_number, year):
    """Calculate total teaching hours from timetable for a specific week"""
    # Get all timetable entries for this faculty
    timetable_entries = Timetable.query.filter_by(faculty_id=faculty_id).all()
    
    # Each timetable entry represents one class per week
    # Assuming each class is 1 hour (adjust based on your system)
    total_hours = len(timetable_entries) * 1.0  # Each class = 1 hour
    
    return total_hours


def get_or_create_workload_record(faculty_id, week_number, year):
    """Get existing workload record or create a new one"""
    workload = FacultyWorkload.query.filter_by(
        faculty_id=faculty_id,
        week_number=week_number,
        year=year
    ).first()
    
    if not workload:
        faculty = Faculty.query.get(faculty_id)
        workload = FacultyWorkload(
            faculty_id=faculty_id,
            week_number=week_number,
            year=year,
            max_hours_allowed=faculty.weekly_max_hours if faculty else 40.0
        )
        db.session.add(workload)
    
    return workload


def update_faculty_workload(faculty_id, week_number=None, year=None):
    """Update workload calculations for a faculty member"""
    if week_number is None or year is None:
        week_number, year = get_week_number_and_year()
    
    workload = get_or_create_workload_record(faculty_id, week_number, year)
    
    # Calculate teaching hours from timetable
    workload.total_teaching_hours = calculate_teaching_hours_for_week(faculty_id, week_number, year)
    
    # Calculate meeting hours for this week
    # Get first and last day of the week
    first_day = datetime.strptime(f'{year}-W{week_number}-1', "%Y-W%W-%w")
    last_day = first_day + timedelta(days=6)
    
    # Get all meetings for this faculty in this week
    meeting_hours = db.session.query(func.sum(Meeting.duration_hours)).join(
        FacultyMeetingParticipation,
        Meeting.id == FacultyMeetingParticipation.meeting_id
    ).filter(
        and_(
            FacultyMeetingParticipation.faculty_id == faculty_id,
            Meeting.start_datetime >= first_day,
            Meeting.start_datetime <= last_day,
            Meeting.status != 'cancelled'
        )
    ).scalar() or 0.0
    
    workload.total_meeting_hours = meeting_hours
    
    # Update totals and status
    workload.update_workload()
    
    db.session.commit()
    return workload


@workload_bp.route("/workload/current", methods=["GET", "OPTIONS"])
@token_required
@teacher_required
def get_current_workload(current_user):
    """Get current week's workload for logged-in teacher"""
    try:
        # Find faculty record for current user
        faculty = Faculty.query.filter_by(
            faculty_name=current_user.full_name,
            dept_id=current_user.dept_id
        ).first()
        
        if not faculty:
            return jsonify({"error": "Faculty record not found"}), 404
        
        # Get current week
        week_number, year = get_week_number_and_year()
        
        # Update workload
        workload = update_faculty_workload(faculty.faculty_id, week_number, year)
        
        return jsonify({
            "week_number": workload.week_number,
            "year": workload.year,
            "total_teaching_hours": workload.total_teaching_hours,
            "total_meeting_hours": workload.total_meeting_hours,
            "total_hours": workload.total_hours,
            "max_hours_allowed": workload.max_hours_allowed,
            "workload_percentage": workload.workload_percentage,
            "status": workload.status,
            "faculty_name": faculty.faculty_name
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@workload_bp.route("/workload/history", methods=["GET", "OPTIONS"])
@token_required
@teacher_required
def get_workload_history(current_user):
    """Get historical workload data for logged-in teacher"""
    try:
        faculty = Faculty.query.filter_by(
            faculty_name=current_user.full_name,
            dept_id=current_user.dept_id
        ).first()
        
        if not faculty:
            return jsonify({"error": "Faculty record not found"}), 404
        
        # Get number of weeks to fetch (default 12)
        weeks = request.args.get('weeks', 12, type=int)
        
        # Get workload records
        workloads = FacultyWorkload.query.filter_by(
            faculty_id=faculty.faculty_id
        ).order_by(FacultyWorkload.year.desc(), FacultyWorkload.week_number.desc()).limit(weeks).all()
        
        return jsonify([{
            "week_number": w.week_number,
            "year": w.year,
            "total_teaching_hours": w.total_teaching_hours,
            "total_meeting_hours": w.total_meeting_hours,
            "total_hours": w.total_hours,
            "workload_percentage": w.workload_percentage,
            "status": w.status
        } for w in workloads]), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@workload_bp.route("/meetings", methods=["GET", "POST", "OPTIONS"])
@token_required
@teacher_required
def manage_meetings(current_user):
    """Get all meetings or create a new meeting"""
    try:
        if request.method == "POST":
            data = request.json
            
            # Validate required fields
            required = ["title", "start_datetime", "end_datetime"]
            if not all(key in data for key in required):
                return jsonify({"error": f"Missing required fields: {', '.join(required)}"}), 400
            
            # Parse datetimes
            start_dt = datetime.fromisoformat(data['start_datetime'].replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(data['end_datetime'].replace('Z', '+00:00'))
            
            # Create meeting
            meeting = Meeting(
                title=data['title'],
                description=data.get('description', ''),
                organizer_id=current_user.id,
                start_datetime=start_dt,
                end_datetime=end_dt,
                location=data.get('location', ''),
                meeting_type=data.get('meeting_type', 'other')
            )
            meeting.calculate_duration()
            
            db.session.add(meeting)
            db.session.flush()  # Get meeting ID
            
            # Add participants (faculty IDs)
            participant_ids = data.get('participant_faculty_ids', [])
            for fac_id in participant_ids:
                participation = FacultyMeetingParticipation(
                    faculty_id=fac_id,
                    meeting_id=meeting.id
                )
                db.session.add(participation)
                
                # Update workload for this faculty
                week_num, yr = get_week_number_and_year(start_dt)
                update_faculty_workload(fac_id, week_num, yr)
            
            db.session.commit()
            
            return jsonify({
                "message": "Meeting created successfully",
                "meeting_id": meeting.id
            }), 201
        
        else:  # GET
            # Get faculty record
            faculty = Faculty.query.filter_by(
                faculty_name=current_user.full_name,
                dept_id=current_user.dept_id
            ).first()
            
            if not faculty:
                # Return empty list if no faculty record
                return jsonify([]), 200
            
            # Get all meetings where user is participant or organizer
            meetings = db.session.query(Meeting).outerjoin(
                FacultyMeetingParticipation,
                Meeting.id == FacultyMeetingParticipation.meeting_id
            ).filter(
                db.or_(
                    Meeting.organizer_id == current_user.id,
                    FacultyMeetingParticipation.faculty_id == faculty.faculty_id
                )
            ).order_by(Meeting.start_datetime.desc()).all()
            
            return jsonify([{
                "id": m.id,
                "title": m.title,
                "description": m.description,
                "start_datetime": m.start_datetime.isoformat(),
                "end_datetime": m.end_datetime.isoformat(),
                "duration_hours": m.duration_hours,
                "location": m.location,
                "meeting_type": m.meeting_type,
                "status": m.status,
                "organizer": m.organizer.full_name if m.organizer else "Unknown"
            } for m in meetings]), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@workload_bp.route("/meetings/<int:meeting_id>", methods=["PUT", "DELETE", "OPTIONS"])
@token_required
@teacher_required
def update_delete_meeting(current_user, meeting_id):
    """Update or delete a meeting"""
    try:
        meeting = Meeting.query.get(meeting_id)
        if not meeting:
            return jsonify({"error": "Meeting not found"}), 404
        
        # Check if user is organizer
        if meeting.organizer_id != current_user.id:
            return jsonify({"error": "Only organizer can modify the meeting"}), 403
        
        if request.method == "DELETE":
            # Get all participants to update their workload
            participants = FacultyMeetingParticipation.query.filter_by(meeting_id=meeting_id).all()
            participant_ids = [p.faculty_id for p in participants]
            week_num, yr = get_week_number_and_year(meeting.start_datetime)
            
            db.session.delete(meeting)
            db.session.commit()
            
            # Update workload for all participants
            for fac_id in participant_ids:
                update_faculty_workload(fac_id, week_num, yr)
            
            return jsonify({"message": "Meeting deleted successfully"}), 200
        
        else:  # PUT
            data = request.json
            
            # Update fields
            if 'title' in data:
                meeting.title = data['title']
            if 'description' in data:
                meeting.description = data['description']
            if 'start_datetime' in data:
                meeting.start_datetime = datetime.fromisoformat(data['start_datetime'].replace('Z', '+00:00'))
            if 'end_datetime' in data:
                meeting.end_datetime = datetime.fromisoformat(data['end_datetime'].replace('Z', '+00:00'))
            if 'location' in data:
                meeting.location = data['location']
            if 'meeting_type' in data:
                meeting.meeting_type = data['meeting_type']
            if 'status' in data:
                meeting.status = data['status']
            
            meeting.calculate_duration()
            meeting.updated_at = datetime.utcnow()
            
            db.session.commit()
            
            # Update workload for all participants
            participants = FacultyMeetingParticipation.query.filter_by(meeting_id=meeting_id).all()
            week_num, yr = get_week_number_and_year(meeting.start_datetime)
            for p in participants:
                update_faculty_workload(p.faculty_id, week_num, yr)
            
            return jsonify({"message": "Meeting updated successfully"}), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# Admin endpoints
@workload_bp.route("/admin/workload-overview", methods=["GET", "OPTIONS"])
@token_required
def admin_workload_overview(current_user):
    """Admin view of all faculty workloads"""
    if current_user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        week_number, year = get_week_number_and_year()
        
        # Get all active faculty
        all_faculty = Faculty.query.filter_by(is_active=True).all()
        
        results = []
        for faculty in all_faculty:
            # Update workload
            workload = update_faculty_workload(faculty.faculty_id, week_number, year)
            
            results.append({
                "faculty_id": faculty.faculty_id,
                "faculty_name": faculty.faculty_name,
                "department_id": faculty.dept_id,
                "total_hours": workload.total_hours,
                "teaching_hours": workload.total_teaching_hours,
                "meeting_hours": workload.total_meeting_hours,
                "workload_percentage": workload.workload_percentage,
                "status": workload.status,
                "max_hours": workload.max_hours_allowed
            })
        
        return jsonify({
            "week_number": week_number,
            "year": year,
            "faculty_workloads": results
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@workload_bp.route("/admin/workload-alerts", methods=["GET", "OPTIONS"])
@token_required
def admin_workload_alerts(current_user):
    """Get faculty with workload alerts (overloaded/underloaded)"""
    if current_user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403
    
    try:
        week_number, year = get_week_number_and_year()
        
        # Get workload records with alerts
        overloaded = FacultyWorkload.query.filter_by(
            week_number=week_number,
            year=year,
            status="overloaded"
        ).all()
        
        underloaded = FacultyWorkload.query.filter_by(
            week_number=week_number,
            year=year,
            status="underloaded"
        ).all()
        
        return jsonify({
            "overloaded": [{
                "faculty_name": w.faculty.faculty_name,
                "total_hours": w.total_hours,
                "max_hours": w.max_hours_allowed,
                "percentage": w.workload_percentage
            } for w in overloaded],
            "underloaded": [{
                "faculty_name": w.faculty.faculty_name,
                "total_hours": w.total_hours,
                "max_hours": w.max_hours_allowed,
                "percentage": w.workload_percentage
            } for w in underloaded]
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
