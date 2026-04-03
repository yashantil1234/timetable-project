import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    from app import create_app
    from extensions import db
    from models.meeting import Meeting
    from models.user_google_auth import UserGoogleAuth
    
    app = create_app()
    with app.app_context():
        print("--- LAST 5 MEETINGS ---")
        meetings = Meeting.query.order_by(Meeting.id.desc()).limit(5).all()
        if not meetings:
            print("No meetings found.")
        for m in meetings:
            print(f"ID: {m.id} | Title: {m.title} | Link: {m.meeting_link} | Start: {m.start_datetime}")
        
        print("\n--- GOOGLE AUTH STATUS ---")
        auths = UserGoogleAuth.query.all()
        if not auths:
            print("No Google Auth records found.")
        for a in auths:
            print(f"User ID: {a.user_id} | Cal ID: {a.calendar_id} | Status: {a.sync_status} | Error: {a.last_error}")
            
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
