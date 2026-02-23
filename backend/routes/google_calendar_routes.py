from flask import Blueprint, request, jsonify
from services.google_calendar_service import (
    get_auth_url,
    handle_auth_callback,
    sync_timetable,
)
from utils.decorators import token_required
from models import UserGoogleAuth
from extensions import db

google_calendar_bp = Blueprint('google_calendar', __name__)


@google_calendar_bp.route('/auth/google/url', methods=['GET', 'OPTIONS'])
@token_required
def get_google_auth_url(current_user):
    """Get the Google OAuth 2.0 authorization URL."""
    redirect_uri = request.args.get('redirect_uri')
    if not redirect_uri:
        return jsonify({"error": "redirect_uri is required"}), 400
    try:
        url = get_auth_url(redirect_uri, login_hint=current_user.email)
        return jsonify({"url": url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@google_calendar_bp.route('/auth/google/callback', methods=['POST', 'OPTIONS'])
@token_required
def auth_callback(current_user):
    """Exchange OAuth code for tokens and trigger initial sync."""
    data = request.json or {}
    code = data.get('code')
    redirect_uri = data.get('redirect_uri')

    if not code or not redirect_uri:
        return jsonify({"error": "code and redirect_uri are required"}), 400

    try:
        success = handle_auth_callback(code, redirect_uri, current_user)
        if success:
            sync_timetable(current_user, force=True)
            return jsonify({"message": "Google Calendar connected successfully"}), 200
        else:
            return jsonify({"error": "Failed to connect Google Calendar"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@google_calendar_bp.route('/calendar/status', methods=['GET', 'OPTIONS'])
@token_required
def get_status(current_user):
    """Get connection status and last sync metadata."""
    auth = UserGoogleAuth.query.filter_by(user_id=current_user.id).first()
    if not auth:
        return jsonify({"is_connected": False}), 200
    return jsonify(auth.to_dict()), 200


@google_calendar_bp.route('/calendar/sync', methods=['POST', 'OPTIONS'])
@token_required
def sync_calendar(current_user):
    """Manually trigger a timetable sync."""
    try:
        success = sync_timetable(current_user, force=True)
        if success:
            return jsonify({"message": "Calendar sync completed"}), 200
        else:
            return jsonify({"error": "Sync failed — check connection status"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@google_calendar_bp.route('/calendar/disconnect', methods=['POST', 'OPTIONS'])
@token_required
def disconnect_calendar(current_user):
    """Disconnect Google Calendar and remove stored tokens."""
    auth = UserGoogleAuth.query.filter_by(user_id=current_user.id).first()
    if auth:
        db.session.delete(auth)
        db.session.commit()
    return jsonify({"message": "Disconnected Google Calendar"}), 200
