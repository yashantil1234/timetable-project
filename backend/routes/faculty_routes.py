"""
Faculty routes - Room marking and swap requests
"""

from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from extensions import db
from models import Classroom, RoomOccupancy, Faculty, SwapRequest, Timetable
from utils.decorators import token_required, teacher_required
from utils.export_utils import export_csvs

faculty_bp = Blueprint('faculty', __name__)


@faculty_bp.route("/mark_room", methods=["GET", "POST", "OPTIONS"])
@token_required
def mark_room(current_user):
    if request.method != "POST":
        return jsonify({"message": "Use POST with JSON: room_id, status ('free'|'occupied'), notes (optional)"}), 200
    if current_user.role != "teacher":
        return jsonify({"error": "Unauthorized - Teachers only"}), 403
    
    try:
        data = request.json
        print(f"DEBUG mark_room: Received data: {data}")
        room_id = data.get("room_id")
        print(f"DEBUG mark_room: extracted room_id: {room_id}")
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
        
        export_csvs()
        
        return jsonify({"message": f"Room {room.name} marked as {status}"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# This route is registered directly in app.py at /rooms/status
def get_rooms_status(current_user):
    try:
        all_rooms = Classroom.query.all()
        free_rooms, unmarked_rooms, occupied_rooms = [], [], []
        
        for room in all_rooms:
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


@faculty_bp.route("/swap-requests", methods=["GET", "POST"])
@token_required
@teacher_required
def teacher_swap_requests(current_user):
    try:
        faculty = Faculty.query.filter_by(faculty_name=current_user.full_name, dept_id=current_user.dept_id).first()
        if not faculty:
            # Fallback - try strictly by name pattern or create
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

        if request.method == "POST":
            data = request.json
            required = ["original_timetable_id", "proposed_day", "proposed_start_time", "reason"]
            if not all(key in data for key in required):
                return jsonify({"error": f"Missing required fields: {', '.join(required)}"}), 400

            timetable_entry = Timetable.query.get(data['original_timetable_id'])
            if not timetable_entry or timetable_entry.faculty_id != faculty.faculty_id:
                return jsonify({"error": "You can only request to move your own classes."}), 403

            new_request = SwapRequest(
                requesting_faculty_id=faculty.faculty_id,
                original_timetable_id=data['original_timetable_id'],
                proposed_day=data['proposed_day'],
                proposed_start_time=data['proposed_start_time'],
                reason=data['reason']
            )
            db.session.add(new_request)
            db.session.commit()
            return jsonify({"message": "Swap request submitted successfully."}), 201

        if request.method == "GET":
            # DEBUG LOGGING
            with open("debug_api_log.txt", "a") as f:
                f.write(f"GET /swap-requests: User={current_user.full_name} (ID {current_user.id})\n")
                f.write(f"Resolved Faculty ID: {faculty.faculty_id if faculty else 'None'}\n")
            
            requests = SwapRequest.query.filter_by(requesting_faculty_id=faculty.faculty_id).all()
            
            with open("debug_api_log.txt", "a") as f:
                 f.write(f"Found {len(requests)} swap requests.\n")

            return jsonify([{
                "id": r.id,
                "course_name": r.original_timetable_entry.course.name if r.original_timetable_entry and r.original_timetable_entry.course else "Unknown Course",
                
                "original_day": r.original_timetable_entry.day if r.original_timetable_entry else "N/A",
                "original_start_time": r.original_timetable_entry.start_time if r.original_timetable_entry else "N/A",
                "proposed_day": r.proposed_day,
                "proposed_start_time": r.proposed_start_time,
                "status": r.status,
                "reason": r.reason,
                "admin_notes": r.admin_notes,
                "created_at": r.created_at.isoformat()
            } for r in requests])
            
    except Exception as e:
        with open("debug_api_log.txt", "a") as f:
            f.write(f"ERROR in teacher_swap_requests: {str(e)}\n")
            import traceback
            traceback.print_exc(file=f)
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500
