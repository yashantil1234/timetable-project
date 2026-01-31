"""
Authentication routes
"""

from flask import Blueprint, request, jsonify, make_response
from datetime import datetime, timedelta
import jwt
from extensions import db
from models import User
from utils.decorators import token_required

auth_bp = Blueprint('auth', __name__)


@auth_bp.route("/register", methods=["GET", "POST", "OPTIONS"])
def register():
    if request.method != "POST":
        return jsonify({"message": "Use POST with JSON: username, password, role (student/teacher/admin), optional dept_id/year/section_id"}), 200
    data = request.json
    username = data.get("username")
    password = data.get("password")
    role = data.get("role")
    dept_id = data.get("dept_id")
    year = data.get("year")

    if not username or not password or role not in ["student", "teacher", "admin"]:
        return jsonify({"error": "Invalid data"}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username exists"}), 400

    user_data = {
        "username": username,
        "role": role,
        "dept_id": dept_id,
        "year": year,
    }
    user = User(**user_data)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()
    return jsonify({"message": f"{role.capitalize()} registered successfully"}), 201


@auth_bp.route("/login", methods=["GET", "POST", "OPTIONS"])
def login():
    # Flask-CORS handles OPTIONS preflight automatically
    if request.method == "OPTIONS":
        return make_response(), 200

    try:
        if request.method != "POST":
            return jsonify({"message": "Use POST with JSON: username, password"}), 200
        data = request.json
        username = data.get("username")
        password = data.get("password")
        
        user = User.query.filter_by(username=username, is_active=True).first()
        if user and user.check_password(password):
            from flask import current_app
            token = jwt.encode({
                "user_id": user.id,
                "exp": datetime.utcnow() + timedelta(hours=8)
            }, current_app.config["SECRET_KEY"], algorithm="HS256")
            
            return jsonify({
                "token": token,
                "role": user.role,
                "user_id": user.id,
                "full_name": user.full_name,
                "department": user.department.dept_name if user.department else None
            }), 200
        
        return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/admin/login", methods=["GET", "POST", "OPTIONS"])
def admin_login():
    # Flask-CORS handles OPTIONS preflight automatically
    if request.method == "OPTIONS":
        return make_response(), 200

    try:
        if request.method != "POST":
            return jsonify({"message": "Use POST with JSON: username, password (admin credentials)"}), 200
        data = request.json or {}
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"error": "Username and password required"}), 400

        user = User.query.filter_by(username=username, role="admin", is_active=True).first()

        if not user or not user.check_password(password):
            return jsonify({"error": "Invalid admin credentials"}), 401

        from flask import current_app
        token = jwt.encode(
            {
                "user_id": user.id,
                "role": user.role,
                "exp": datetime.utcnow() + timedelta(hours=8)
            },
            current_app.config["SECRET_KEY"],
            algorithm="HS256"
        )

        return jsonify({
            "message": "Admin login successful",
            "token": token,
            "role": user.role,
            "user_id": user.id
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
