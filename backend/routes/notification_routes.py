"""
Notification Routes
Handles fetching notifications and managing preferences.
"""

from flask import Blueprint, request, jsonify
from extensions import db
from models import Notification, NotificationPreference, User
from utils.decorators import token_required
from datetime import datetime

notification_bp = Blueprint('notification', __name__)

# ========== SHARED SERVICE FUNCTION ==========

def create_notification(user_id, title, message, category='system', type='info', link=None,
                        file_url=None, file_name=None, file_type=None, sender_name=None):
    """
    Internal service to create a notification.
    Checks user preferences before creating.
    """
    try:
        # Get or create preferences
        prefs = NotificationPreference.query.filter_by(user_id=user_id).first()
        if not prefs:
            prefs = NotificationPreference(user_id=user_id)
            db.session.add(prefs)
            db.session.commit()

        # Check if enabled
        is_enabled = True
        if category == 'system' and not prefs.system_alerts: is_enabled = False
        if category == 'academic' and not prefs.academic_updates: is_enabled = False
        if category == 'resource' and not prefs.resource_updates: is_enabled = False

        if not is_enabled:
            return None

        # In-App Notification
        if prefs.app_enabled:
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                category=category,
                notification_type=type,
                link=link,
                file_url=file_url,
                file_name=file_name,
                file_type=file_type,
                sender_name=sender_name
            )
            db.session.add(notification)
            db.session.commit()
            return notification
        
        # Email Notification (Placeholder)
        if prefs.email_enabled:
            # Here we would send an email
            print(f"Sending email to user {user_id}: {title} - {message}")
            
        return None
        
    except Exception as e:
        print(f"Error creating notification: {e}")
        return None


# ========== ENDPOINTS ==========

@notification_bp.route("/notifications", methods=["GET", "DELETE", "OPTIONS"])
@token_required
def manage_notifications(current_user):
    """Get all notifications or clear all"""
    try:
        if request.method == "DELETE":
            # Clear all
            Notification.query.filter_by(user_id=current_user.id).delete()
            db.session.commit()
            return jsonify({"message": "All notifications cleared"}), 200
        
        else:  # GET
            # Retrieve last 50 notifications, latest first
            notifications = Notification.query.filter_by(user_id=current_user.id)\
                .order_by(Notification.created_at.desc())\
                .limit(50).all()
            
            # Count unread
            unread_count = Notification.query.filter_by(user_id=current_user.id, is_read=False).count()
            
            return jsonify({
                "notifications": [n.to_dict() for n in notifications],
                "unread_count": unread_count
            }), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@notification_bp.route("/notifications/<int:notification_id>/read", methods=["PUT", "OPTIONS"])
@token_required
def mark_read(current_user, notification_id):
    """Mark a specific notification as read"""
    try:
        notification = Notification.query.get(notification_id)
        if not notification or notification.user_id != current_user.id:
            return jsonify({"error": "Notification not found"}), 404
        
        notification.is_read = True
        db.session.commit()
        
        return jsonify({"message": "Marked as read"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@notification_bp.route("/notifications/read-all", methods=["PUT", "OPTIONS"])
@token_required
def mark_all_read(current_user):
    """Mark all notifications as read"""
    try:
        Notification.query.filter_by(user_id=current_user.id, is_read=False)\
            .update({"is_read": True})
        db.session.commit()
        
        return jsonify({"message": "All marked as read"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@notification_bp.route("/notifications/preferences", methods=["GET", "PUT", "OPTIONS"])
@token_required
def manage_preferences(current_user):
    """Get or update notification preferences"""
    try:
        prefs = NotificationPreference.query.filter_by(user_id=current_user.id).first()
        if not prefs:
            prefs = NotificationPreference(user_id=current_user.id)
            db.session.add(prefs)
            db.session.commit()
            
        if request.method == "GET":
            return jsonify(prefs.to_dict()), 200
        
        else:  # PUT
            data = request.json
            if 'email_enabled' in data: prefs.email_enabled = data['email_enabled']
            if 'app_enabled' in data: prefs.app_enabled = data['app_enabled']
            if 'system_alerts' in data: prefs.system_alerts = data['system_alerts']
            if 'academic_updates' in data: prefs.academic_updates = data['academic_updates']
            if 'resource_updates' in data: prefs.resource_updates = data['resource_updates']
            
            db.session.commit()
            return jsonify({
                "message": "Preferences updated",
                "preferences": prefs.to_dict()
            }), 200
            
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ========== TEST ENDPOINT (DEV ONLY) ==========
@notification_bp.route("/notifications/test", methods=["POST", "OPTIONS"])
@token_required
def test_notification(current_user):
    """Trigger a test notification"""
    data = request.json
    create_notification(
        user_id=current_user.id,
        title=data.get('title', 'Test Notification'),
        message=data.get('message', 'This is a test message'),
        category=data.get('category', 'system'),
        type=data.get('type', 'info')
    )
    return jsonify({"message": "Notification triggered"}), 201
@notification_bp.route("/admin/notifications/send", methods=["POST", "OPTIONS"])
@token_required
def send_notification(current_user):
    """Admin/Teacher: Send notification to users with granular targeting"""
    if current_user.role not in ['admin', 'teacher']:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        from models.department import Department
        from models.section import Section

        data = request.json
        title = data.get('title')
        message = data.get('message')

        # target_audience: 'all', 'role', 'user', 'department', 'section'
        target_audience = data.get('target_audience', 'all')
        target_role = data.get('target_role')          # 'student', 'teacher', 'admin'
        target_user_id = data.get('target_user_id')   # specific user id
        target_dept_id = data.get('target_dept_id')   # specific department id
        target_section_id = data.get('target_section_id')  # specific section id

        if not title or not message:
            return jsonify({"error": "Title and message are required"}), 400

        users_to_notify = []

        if target_audience == 'user' and target_user_id:
            user = User.query.get(target_user_id)
            if user:
                users_to_notify.append(user)

        elif target_audience == 'role' and target_role:
            users_to_notify = User.query.filter_by(role=target_role, is_active=True).all()

        elif target_audience == 'department' and target_dept_id:
            # All active users (students + teachers) in a department
            users_to_notify = User.query.filter_by(dept_id=target_dept_id, is_active=True).all()

        elif target_audience == 'section' and target_section_id:
            # Students in a specific section
            users_to_notify = User.query.filter_by(
                section_id=target_section_id,
                role='student',
                is_active=True
            ).all()

        elif target_audience == 'all':
            users_to_notify = User.query.filter_by(is_active=True).all()

        count = 0
        for user in users_to_notify:
            create_notification(
                user_id=user.id,
                title=title,
                message=message,
                category='system',
                type='info'
            )
            count += 1

        return jsonify({"message": f"Notification sent to {count} users", "count": count}), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@notification_bp.route("/admin/notifications/targets", methods=["GET", "OPTIONS"])
@token_required
def get_notification_targets(current_user):
    """Get lists of users, departments, sections for notification targeting"""
    if current_user.role not in ['admin', 'teacher']:
        return jsonify({"error": "Unauthorized"}), 403

    try:
        from models.department import Department
        from models.section import Section

        # All active users (excluding current user)
        users = User.query.filter(
            User.is_active == True,
            User.id != current_user.id
        ).order_by(User.full_name).all()

        # All departments
        departments = Department.query.order_by(Department.dept_name).all()

        # All sections with their department
        sections = Section.query.order_by(Section.year, Section.name).all()

        return jsonify({
            "users": [{"id": u.id, "name": u.full_name or u.username, "role": u.role, "dept": u.department.dept_name if u.department else None} for u in users],
            "departments": [{"id": d.id, "name": d.dept_name} for d in departments],
            "sections": [{"id": s.id, "name": s.name, "year": s.year, "dept_id": s.dept_id, "dept_name": s.department.dept_name if s.department else None} for s in sections]
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ==================== FILE NOTIFICATION ROUTE ====================

ALLOWED_EXTENSIONS = {'pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg'}

def _allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@notification_bp.route("/admin/notifications/send-with-file", methods=["POST", "OPTIONS"])
@token_required
def send_notification_with_file(current_user):
    """Send a notification with an optional file attachment (multipart/form-data)"""
    if current_user.role not in ['admin', 'teacher']:
        return jsonify({"error": "Unauthorized"}), 403

    import os, uuid
    from werkzeug.utils import secure_filename
    from flask import current_app
    from models.department import Department
    from models.section import Section

    try:
        # ── Extract text fields from form data ──
        title           = request.form.get('title', '').strip()
        message         = request.form.get('message', '').strip()
        target_audience = request.form.get('target_audience', 'all')
        target_role     = request.form.get('target_role')
        target_user_id  = request.form.get('target_user_id')
        target_dept_id  = request.form.get('target_dept_id')
        target_section_id = request.form.get('target_section_id')

        if not title or not message:
            return jsonify({'error': 'Title and message are required'}), 400

        # ── Handle file upload ──
        file_url  = None
        file_name = None
        file_type = None

        uploaded_file = request.files.get('file')
        if uploaded_file and uploaded_file.filename:
            original_name = uploaded_file.filename
            
            # Re-validate file type on backend
            if not _allowed_file(original_name):
                return jsonify({'error': f'File type not allowed. Allowed: {", ".join(ALLOWED_EXTENSIONS)}'}), 400

            # CRITICAL: Backend file size check (5MB limit)
            # Read header to avoid processing massive files if possible, 
            # though Flask/WSGI usually handles content-length.
            uploaded_file.seek(0, os.SEEK_END)
            file_size = uploaded_file.tell()
            uploaded_file.seek(0) # Reset pointer
            
            if file_size > 5 * 1024 * 1024:
                return jsonify({'error': 'File too large. Maximum size is 5MB.'}), 400

            ext          = original_name.rsplit('.', 1)[1].lower()
            safe_name    = secure_filename(original_name)
            unique_name  = f"{uuid.uuid4().hex}_{safe_name}"  # prevent overwrites
            upload_folder = current_app.config.get('UPLOAD_FOLDER', 'uploads')
            os.makedirs(upload_folder, exist_ok=True)
            save_path = os.path.join(upload_folder, unique_name)
            uploaded_file.save(save_path)

            file_url  = f"/api/uploads/{unique_name}"
            file_name = original_name          # shown in UI
            file_type = ext

        # ── Resolve target users (same logic as existing send route) ──
        users_to_notify = []
        if target_audience == 'user' and target_user_id:
            user = User.query.get(int(target_user_id))
            if user:
                users_to_notify.append(user)
        elif target_audience == 'role' and target_role:
            users_to_notify = User.query.filter_by(role=target_role, is_active=True).all()
        elif target_audience == 'department' and target_dept_id:
            users_to_notify = User.query.filter_by(dept_id=int(target_dept_id), is_active=True).all()
        elif target_audience == 'section' and target_section_id:
            users_to_notify = User.query.filter_by(
                section_id=int(target_section_id), role='student', is_active=True
            ).all()
        elif target_audience == 'all':
            users_to_notify = User.query.filter_by(is_active=True).all()

        sender_name = current_user.full_name or current_user.username

        count = 0
        for user in users_to_notify:
            create_notification(
                user_id=user.id,
                title=title,
                message=message,
                category='system',
                type='file' if file_url else 'info',
                file_url=file_url,
                file_name=file_name,
                file_type=file_type,
                sender_name=sender_name
            )
            count += 1

        return jsonify({
            'message': f'Notification sent to {count} users',
            'count': count,
            'has_file': file_url is not None,
            'file_name': file_name
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
