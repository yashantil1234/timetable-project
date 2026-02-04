
from app import create_app
from extensions import db
from models import User
import random

def populate_details():
    app = create_app()
    with app.app_context():
        students = User.query.filter_by(role="student").all()
        print(f"Found {len(students)} students.")
        
        for i, s in enumerate(students):
            if not s.roll_number:
                s.roll_number = f"CS{21000 + i}"
            if not s.phone:
                s.phone = f"+91 98{random.randint(10000000, 99999999)}"
            if s.attendance == 0.0 or s.attendance is None:
                s.attendance = round(random.uniform(70.0, 95.0), 1)
                
            print(f"Updated {s.username}: Roll={s.roll_number}, Phone={s.phone}, Att={s.attendance}%")
            
        db.session.commit()
        print("Done.")

if __name__ == "__main__":
    populate_details()
