
from app import app
from extensions import db
from models import User, Resource, ResourceBooking, Notification, NotificationPreference
from datetime import datetime, timedelta
import sys

def run_test():
    print("Setting up test database...")
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        db.create_all()
        
        # 1. Create Users
        print("Creating users...")
        teacher = User(username="teacher_user", email="teacher@test.com", role="teacher", full_name="Prof. Test", password_hash="placeholder")
        teacher.set_password("password")
        
        student = User(username="student_user", email="student@test.com", role="student", full_name="Student Test", password_hash="placeholder")
        student.set_password("password")
        
        db.session.add_all([teacher, student])
        db.session.commit()
        
        # 2. Preferences
        print("Setting preferences...")
        prefs = NotificationPreference(user_id=student.id, academic_updates=True, resource_updates=True)
        db.session.add(prefs)
        db.session.commit()
        
        # 3. Create Resource
        print("Creating resource...")
        res = Resource(name='Lab 1', resource_type='lab')
        db.session.add(res)
        db.session.commit()
        
        # 4. Booking
        print("Creating booking...")
        booking = ResourceBooking(
            resource_id=res.id,
            user_id=teacher.id,
            start_time=datetime.utcnow() + timedelta(days=1),
            end_time=datetime.utcnow() + timedelta(days=1, hours=2),
            title='Lab Session',
            status='approved'
        )
        db.session.add(booking)
        db.session.commit()
        
        # 5. Notification
        print("Creating notification...")
        # Simulating the service logic call
        from routes.notification_routes import create_notification
        notif = create_notification(
            user_id=teacher.id,  # Send to teacher for simplicity
            title='Booking Confirmed',
            message='Your booking for Lab 1 is confirmed.',
            category='resource'
        )
        
        # Verification
        if not notif:
            print("ERROR: Notification not created (maybe logic returned None?)")
            sys.exit(1)
            
        assert notif.title == 'Booking Confirmed'
        print("Notification created successfully")
        
        saved_notif = Notification.query.filter_by(user_id=teacher.id).first()
        if not saved_notif:
             print("ERROR: Notification not found in DB")
             sys.exit(1)
             
        print(f"Verified saved notification: {saved_notif.title}")
        
        print("\nALL INTEGRATION TESTS PASSED!")

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
