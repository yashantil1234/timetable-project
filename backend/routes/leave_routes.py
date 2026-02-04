"""
Leave request routes
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from extensions import db
from models import LeaveRequest
from utils.decorators import token_required

leave_bp = Blueprint('leave', __name__)


@leave_bp.route("/request", methods=["POST"])
@token_required
def submit_leave_request(current_user):
    try:
        data = request.json
        required_fields = ["leave_type", "start_date", "end_date", "reason"]
        
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields: leave_type, start_date, end_date, reason"}), 400
        
        valid_types = ["sick", "vacation", "personal", "emergency", "medical", "family", "Casual Leave", "casual"]
        if data["leave_type"] not in valid_types:
            return jsonify({"error": f"Invalid leave type. Must be one of: {', '.join(valid_types)}"}), 400
        
        try:
            start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
            end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400
        
        if start_date > end_date:
            return jsonify({"error": "Start date cannot be after end date"}), 400
        
        if start_date < datetime.now().date():
            return jsonify({"error": "Cannot request leave for past dates"}), 400
        
        overlapping = LeaveRequest.query.filter(
            LeaveRequest.user_id == current_user.id,
            LeaveRequest.status.in_(["pending", "approved"]),
            LeaveRequest.start_date <= end_date,
            LeaveRequest.end_date >= start_date
        ).first()
        
        if overlapping:
            return jsonify({"error": "You already have a leave request for overlapping dates"}), 400
        
        leave_request = LeaveRequest(
            user_id=current_user.id,
            leave_type=data["leave_type"],
            start_date=start_date,
            end_date=end_date,
            reason=data["reason"]
        )
        
        db.session.add(leave_request)
        db.session.commit()
        
        return jsonify({
            "message": "Leave request submitted successfully",
            "request_id": leave_request.id,
            "status": "pending"
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to submit leave request: {str(e)}"}), 500


@leave_bp.route("/my-requests", methods=["GET"])
@token_required
def get_my_leave_requests(current_user):
    try:
        status_filter = request.args.get("status")
        query = LeaveRequest.query.filter_by(user_id=current_user.id)
        
        if status_filter:
            query = query.filter_by(status=status_filter)
        
        requests = query.order_by(LeaveRequest.created_at.desc()).all()
        
        with open("debug_api_log.txt", "a") as f:
            f.write(f"GET /leave/my-requests: User={current_user.full_name} (ID {current_user.id})\n")
            f.write(f"Found {len(requests)} leave requests.\n")
        
        return jsonify([{
            "id": req.id,
            "leave_type": req.leave_type,
            "start_date": req.start_date.isoformat(),
            "end_date": req.end_date.isoformat(),
            "reason": req.reason,
            "status": req.status,
            "admin_notes": req.admin_notes,
            "created_at": req.created_at.isoformat(),
            "updated_at": req.updated_at.isoformat(),
            "days_requested": (req.end_date - req.start_date).days + 1
        } for req in requests])
    except Exception as e:
        return jsonify({"error": f"Failed to fetch leave requests: {str(e)}"}), 500


@leave_bp.route("/request/<int:request_id>", methods=["GET"])
@token_required
def get_leave_request_details(current_user, request_id):
    try:
        leave_request = LeaveRequest.query.filter_by(id=request_id, user_id=current_user.id).first()
        if not leave_request:
            return jsonify({"error": "Leave request not found"}), 404
        
        return jsonify({
            "id": leave_request.id,
            "leave_type": leave_request.leave_type,
            "start_date": leave_request.start_date.isoformat(),
            "end_date": leave_request.end_date.isoformat(),
            "reason": leave_request.reason,
            "status": leave_request.status,
            "admin_notes": leave_request.admin_notes,
            "created_at": leave_request.created_at.isoformat(),
            "updated_at": leave_request.updated_at.isoformat(),
            "days_requested": (leave_request.end_date - leave_request.start_date).days + 1,
            "approver": leave_request.approver.username if leave_request.approver else None
        })
    except Exception as e:
        return jsonify({"error": f"Failed to fetch leave request: {str(e)}"}), 500


@leave_bp.route("/request/<int:request_id>", methods=["PUT"])
@token_required
def update_leave_request(current_user, request_id):
    try:
        leave_request = LeaveRequest.query.filter_by(id=request_id, user_id=current_user.id).first()
        if not leave_request:
            return jsonify({"error": "Leave request not found"}), 404
        
        if leave_request.status != "pending":
            return jsonify({"error": "Cannot modify approved/rejected request"}), 400
        
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        if "start_date" in data:
            try:
                new_start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
                if new_start_date < datetime.now().date():
                    return jsonify({"error": "Cannot set start date in the past"}), 400
                leave_request.start_date = new_start_date
            except ValueError:
                return jsonify({"error": "Invalid start_date format. Use YYYY-MM-DD"}), 400
        
        if "end_date" in data:
            try:
                new_end_date = datetime.strptime(data["end_date"], "%Y-%m-%d").date()
                if new_end_date < leave_request.start_date:
                    return jsonify({"error": "End date cannot be before start date"}), 400
                leave_request.end_date = new_end_date
            except ValueError:
                return jsonify({"error": "Invalid end_date format. Use YYYY-MM-DD"}), 400
        
        if "reason" in data:
            leave_request.reason = data["reason"]
        
        if "leave_type" in data:
            valid_types = ["sick", "vacation", "personal", "emergency", "medical", "family"]
            if data["leave_type"] not in valid_types:
                return jsonify({"error": f"Invalid leave type. Must be one of: {', '.join(valid_types)}"}), 400
            leave_request.leave_type = data["leave_type"]
        
        leave_request.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({"message": "Leave request updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update leave request: {str(e)}"}), 500


@leave_bp.route("/request/<int:request_id>", methods=["DELETE"])
@token_required
def cancel_leave_request(current_user, request_id):
    try:
        leave_request = LeaveRequest.query.filter_by(id=request_id, user_id=current_user.id).first()
        if not leave_request:
            return jsonify({"error": "Leave request not found"}), 404
        
        if leave_request.status != "pending":
            return jsonify({"error": "Cannot cancel approved/rejected request"}), 400
        
        db.session.delete(leave_request)
        db.session.commit()
        
        return jsonify({"message": "Leave request cancelled successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to cancel leave request: {str(e)}"}), 500
