from functools import wraps
from flask import request, jsonify, make_response, current_app
import jwt
from models.user import User

def _extract_token_from_request():
    # Prefer standard Authorization: Bearer <token>
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
        print(f"DEBUG: Found Bearer token: {token[:20]}...")
        return token
    # Backward compatible with existing x-access-token
    x_token = request.headers.get("x-access-token")
    if x_token:
        print(f"DEBUG: Found x-access-token: {x_token[:20]}...")
    else:
        print("DEBUG: No token found in headers")
        print(f"DEBUG: Available headers: {list(request.headers.keys())}")
    return x_token

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Allow OPTIONS requests for CORS preflight without authentication
        # Flask-CORS (via @cross_origin or global config with automatic_options=True) will handle OPTIONS
        if request.method == "OPTIONS":
            # Return empty response - @cross_origin decorator will add CORS headers
            # The @cross_origin decorator wraps this function and will process the response
            response = make_response()
            response.status_code = 200
            return response

        token = _extract_token_from_request()
        if not token:
            return jsonify({"error": "Token missing"}), 401
        try:
            data = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = User.query.get(data["user_id"])
            if not current_user or not current_user.is_active:
                return jsonify({"error": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"error": "Token invalid", "details": str(e)}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def wrapper(current_user, *args, **kwargs):
        # Allow OPTIONS requests for CORS preflight without authentication
        # Flask-CORS will handle the headers automatically
        if request.method == "OPTIONS":
            # Return empty response - Flask-CORS will add headers
            response = make_response()
            response.status_code = 200
            return response

        if current_user.role != "admin":
            return jsonify({"error": "Admin only"}), 403
        return f(current_user, *args, **kwargs)
    return wrapper

def teacher_required(f):
    @wraps(f)
    def wrapper(current_user, *args, **kwargs):
        if request.method == "OPTIONS":
            response = make_response()
            response.status_code = 200
            return response

        if current_user.role not in ["teacher", "admin"]:
            return jsonify({"error": "Teacher or admin only"}), 403
        return f(current_user, *args, **kwargs)
    return wrapper
