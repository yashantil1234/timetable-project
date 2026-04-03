import sys
import os
import json

# Add current directory to path
sys.path.append(os.getcwd())

from app import create_app
from extensions import db
from models.user import User
from services.google_calendar_service import create_google_event_with_meet, get_service

def test_meet_gen(user_id):
    app = create_app()
    with app.app_context():
        user = User.query.get(user_id)
        if not user:
            print(f"User {user_id} not found.")
            return

        print(f"Testing Meet generation for user {user.full_name} (ID: {user_id})")
        
        # Test 1: Service connectivity
        service = get_service(user)
        if not service:
            print("FAILED: get_service returned None")
            return
        
        print("Service built successfully.")
        
        # Test 2: Actual generation attempt
        title = "Diagnostic Test Meeting"
        desc = "Testing auto-generation via script"
        start_time = "2026-04-01T10:00:00Z"
        
        try:
            # We bypass the service function to see the raw response
            from services.google_calendar_service import dateutil, uuid, UserGoogleAuth, datetime, IST
            start_dt = dateutil.parser.isoparse(start_time)
            end_dt = start_dt + datetime.timedelta(hours=1)
            
            event_body = {
                'summary': title,
                'description': desc,
                'start': {'dateTime': start_dt.isoformat()},
                'end': {'dateTime': end_dt.isoformat()},
                'conferenceData': {
                    'createRequest': {
                        'requestId': str(uuid.uuid4()),
                        'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                    }
                }
            }
            
            auth_record = UserGoogleAuth.query.filter_by(user_id=user.id).first()
            calendar_id = auth_record.calendar_id if auth_record and auth_record.calendar_id else 'primary'
            
            print(f"Inserting into calendar: {calendar_id}")
            created_event = service.events().insert(
                calendarId=calendar_id, 
                body=event_body,
                conferenceDataVersion=1
            ).execute()
            
            print("--- RAW API RESPONSE ---")
            # Redact sensitive parts if any
            print(json.dumps(created_event, indent=2))
            
            link = created_event.get('hangoutLink')
            print(f"\nRESULT: hangoutLink = {link}")
            
        except Exception as e:
            print(f"CRITICAL ERROR: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    # Change to a user ID that has Google connected (from diag_db output: 6, 8, or 9)
    test_meet_gen(6)
