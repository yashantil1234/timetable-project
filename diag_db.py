import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app import create_app
from extensions import db
from models.meeting import Meeting

app = create_app()
with app.app_context():
    print("--- LAST 5 MEETINGS ---")
    meetings = Meeting.query.order_by(Meeting.id.desc()).limit(5).all()
    for m in meetings:
        print(f"ID: {m.id} | Title: {m.title} | Link: {m.meeting_link} | Audience: {m.audience_role}")
    
    print("\n--- GOOGLE AUTH STATUS ---")
    from models import UserGoogleAuth
    auths = UserGoogleAuth.query.all()
    for a in auths:
        print(f"User ID: {a.user_id} | Cal ID: {a.calendar_id} | Status: {a.sync_status} | Error: {a.last_error}")
