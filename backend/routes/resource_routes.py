"""
Resource Management Routes
Handles resource tracking, booking, and conflict detection
"""

from flask import Blueprint, request, jsonify
from extensions import db
from models import Resource, ResourceBooking, Classroom, Timetable, Course, User
from utils.decorators import token_required, admin_required, teacher_required
from datetime import datetime
from sqlalchemy import or_, and_

resource_bp = Blueprint('resource', __name__)

# ========== RESOURCE CRUD ==========

@resource_bp.route("/resources", methods=["GET", "POST", "OPTIONS"])
@token_required
def manage_resources(current_user):
    """Get all resources or create a new one (admin/teacher)"""
    try:
        if request.method == "POST":
            # Only admin or specific roles can create resources
            if current_user.role not in ['admin', 'teacher']:
                return jsonify({"error": "Unauthorized"}), 403
            
            data = request.json
            required = ["name", "resource_type"]
            if not all(key in data for key in required):
                return jsonify({"error": "Missing required fields"}), 400
            
            resource = Resource(
                name=data['name'],
                resource_type=data['resource_type'],
                description=data.get('description'),
                capacity=data.get('capacity', 1),
                status=data.get('status', 'available'),
                classroom_id=data.get('classroom_id')
            )
            
            db.session.add(resource)
            db.session.commit()
            
            return jsonify({
                "message": "Resource created successfully",
                "resource": resource.to_dict()
            }), 201
        
        else:  # GET
            resources = Resource.query.filter_by(is_active=True).all()
            return jsonify([r.to_dict() for r in resources]), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@resource_bp.route("/resources/<int:resource_id>", methods=["GET", "PUT", "DELETE", "OPTIONS"])
@token_required
def single_resource(current_user, resource_id):
    """Manage a specific resource"""
    try:
        resource = Resource.query.get(resource_id)
        if not resource:
            return jsonify({"error": "Resource not found"}), 404
        
        if request.method == "GET":
            return jsonify(resource.to_dict()), 200
        
        # Admin or authorized teacher only for modify
        if current_user.role not in ['admin', 'teacher']:
            return jsonify({"error": "Unauthorized"}), 403
        
        if request.method == "DELETE":
            # Soft delete
            resource.is_active = False
            db.session.commit()
            return jsonify({"message": "Resource deactivated"}), 200
        
        else:  # PUT
            data = request.json
            if 'name' in data: resource.name = data['name']
            if 'resource_type' in data: resource.resource_type = data['resource_type']
            if 'description' in data: resource.description = data['description']
            if 'capacity' in data: resource.capacity = data['capacity']
            if 'status' in data: resource.status = data['status']
            if 'classroom_id' in data: resource.classroom_id = data['classroom_id']
            
            db.session.commit()
            return jsonify({
                "message": "Resource updated",
                "resource": resource.to_dict()
            }), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# ========== BOOKING MANAGEMENT ==========

@resource_bp.route("/bookings", methods=["GET", "POST", "OPTIONS"])
@token_required
def manage_bookings(current_user):
    """Create a booking or view bookings"""
    try:
        if request.method == "POST":
            data = request.json
            required = ["resource_id", "start_time", "end_time", "title"]
            if not all(key in data for key in required):
                return jsonify({"error": "Missing required fields"}), 400
            
            # Parse times
            start_dt = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
            
            if start_dt >= end_dt:
                return jsonify({"error": "End time must be after start time"}), 400
            
            resource_id = data['resource_id']
            
            # Check for conflicts
            if has_conflict(resource_id, start_dt, end_dt):
                return jsonify({"error": "Resource is unavailable for the selected time slot"}), 409
            
            # Create booking
            # Auto-approve for teachers/admins, pending for students? 
            # Or always pending for labs? Let's say auto-approve for small items, pending for labs.
            # Simplified: Teachers get auto-approved, students get pending
            status = 'approved' if current_user.role in ['teacher', 'admin'] else 'pending'
            
            booking = ResourceBooking(
                resource_id=resource_id,
                user_id=current_user.id,
                start_time=start_dt,
                end_time=end_dt,
                title=data['title'],
                purpose=data.get('purpose'),
                status=status
            )
            
            if status == 'approved':
                booking.approved_by = current_user.id
                booking.approval_date = datetime.utcnow()
            
            db.session.add(booking)
            db.session.commit()
            
            return jsonify({
                "message": f"Booking {'created' if status == 'approved' else 'requested'} successfully",
                "booking": booking.to_dict()
            }), 201
        
        else:  # GET
            # Admins view all, others view their own
            if current_user.role == 'admin':
                bookings = ResourceBooking.query.order_by(ResourceBooking.start_time.desc()).all()
            else:
                bookings = ResourceBooking.query.filter_by(user_id=current_user.id).order_by(ResourceBooking.start_time.desc()).all()
            
            return jsonify([b.to_dict() for b in bookings]), 200
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@resource_bp.route("/bookings/<int:booking_id>", methods=["PUT", "DELETE", "OPTIONS"])
@token_required
def manage_single_booking(current_user, booking_id):
    """Cancel or Approve (admin) a booking"""
    try:
        booking = ResourceBooking.query.get(booking_id)
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
        
        # Check permissions
        is_owner = booking.user_id == current_user.id
        is_admin = current_user.role == 'admin'
        is_staff = current_user.role == 'teacher'  # Maybe teachers can approve student requests?
        
        if not (is_owner or is_admin or is_staff):
            return jsonify({"error": "Unauthorized"}), 403
        
        if request.method == "DELETE":
            # Only owner or admin can delete/cancel
            booking.status = 'cancelled'
            db.session.commit()
            return jsonify({"message": "Booking cancelled"}), 200
        
        else:  # PUT (Update status)
            data = request.json
            new_status = data.get('status')
            
            if new_status:
                # Only admin/staff can approve/reject
                if not (is_admin or is_staff) and new_status in ['approved', 'rejected']:
                    return jsonify({"error": "Unauthorized to approve/reject"}), 403
                
                booking.status = new_status
                if new_status == 'approved':
                    booking.approved_by = current_user.id
                    booking.approval_date = datetime.utcnow()
                elif new_status == 'rejected':
                    booking.rejection_reason = data.get('rejection_reason', 'No reason provided')
                
                db.session.commit()
                return jsonify({"message": f"Booking {new_status}"}), 200
            
            return jsonify({"message": "No changes made"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@resource_bp.route("/check-availability", methods=["GET", "OPTIONS"])
@token_required
def check_availability(current_user):
    """Check if a resource is available at a given time"""
    try:
        resource_id = request.args.get('resource_id', type=int)
        start_time_str = request.args.get('start_time')
        end_time_str = request.args.get('end_time')
        
        if not all([resource_id, start_time_str, end_time_str]):
            return jsonify({"error": "Missing parameters"}), 400
        
        start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
        
        is_available = not has_conflict(resource_id, start_time, end_time)
        
        return jsonify({"available": is_available}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ========== HELPER FUNCTIONS ==========

def has_conflict(resource_id, start_time, end_time):
    """
    Check for booking conflicts:
    1. Overlap with existing accepted bookings
    2. Overlap with timetable classes (if resource is a classroom)
    """
    resource = Resource.query.get(resource_id)
    if not resource:
        return True # Treat nonexistent as unavailable
    
    # 1. Check existing bookings
    conflicting_booking = ResourceBooking.query.filter(
        ResourceBooking.resource_id == resource_id,
        ResourceBooking.status.in_(['approved', 'pending']), # Be conservative, count pending
        ResourceBooking.start_time < end_time,
        ResourceBooking.end_time > start_time
    ).first()
    
    if conflicting_booking:
        return True
    
    # 2. Check timetable if linked to a classroom
    if resource.classroom_id:
        # Convert start/end time to day of week and time slots
        # This is complex because timetable is usually weekly recurring
        # For this simplified version, let's assume we check the specific date's day of week
        
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        day_of_week = day_names[start_time.weekday()]
        
        # Check timetable for this room, day, and overlapping time range
        # Timetable usually stores start_time/end_time as strings 'HH:MM'
        
        start_time_str = start_time.strftime('%H:%M')
        end_time_str = end_time.strftime('%H:%M')
        
        # Simplified query: check if there's any class in this room on this day
        # A robust implementation would parse the time strings and check overlap range for that day
        # For now, let's query classes in this room on this day and do python-side check
        
        classes = Timetable.query.join(CourseAllocation).filter(
            CourseAllocation.classroom_id == resource.classroom_id,
            Timetable.day == day_of_week
        ).all()
        
        for cls in classes:
            # cls.start_time and cls.end_time are strings "HH:MM"
            cls_start = datetime.strptime(cls.start_time, '%H:%M').time()
            cls_end = datetime.strptime(cls.end_time, '%H:%M').time()
            
            req_start = start_time.time()
            req_end = end_time.time()
            
            # Check overlap
            if cls_start < req_end and cls_end > req_start:
                return True
                
    return False
