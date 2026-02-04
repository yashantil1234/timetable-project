
from flask import Blueprint, jsonify
from utils.decorators import token_required
from models import User

student_bp = Blueprint('student', __name__)

@student_bp.route("/profile", methods=["GET", "OPTIONS"])
@token_required
def get_profile(current_user):
    if current_user.role != "student":
        return jsonify({"error": "Unauthorized"}), 403
    
    return jsonify({
        "user_id": current_user.id,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "department": current_user.department.dept_name if current_user.department else None,
        "year": current_user.year,
        "section": current_user.section.name if current_user.section else None,
        "phone": current_user.phone,
        "roll_number": current_user.roll_number,
        "attendance": current_user.attendance
    }), 200
