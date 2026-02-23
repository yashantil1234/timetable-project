
from app import app
from extensions import db
from models import User

def fix_users():
    with app.app_context():
        # Define expected users
        users_to_fix = [
            {"username": "admin", "role": "admin", "password": "password123"},
            {"username": "teacher1", "role": "teacher", "password": "password123", "email": "teacher1@test.com", "full_name": "Teacher One"},
            {"username": "student1", "role": "student", "password": "password123", "email": "student1@test.com", "full_name": "Student One"}
        ]
        
        print("Checking users...")
        for u_data in users_to_fix:
            user = User.query.filter_by(username=u_data["username"]).first()
            if not user:
                print(f"User {u_data['username']} not found. Creating...")
                # Create user
                new_user = User(
                    username=u_data["username"],
                    role=u_data["role"],
                    email=u_data.get("email"),
                    full_name=u_data.get("full_name"),
                    password_hash="temp" # will set below
                )
                new_user.set_password(u_data["password"])
                db.session.add(new_user)
            else:
                print(f"User {u_data['username']} found. Resetting password...")
                user.set_password(u_data["password"])
        
        db.session.commit()
        print("Users updated successfully.")

if __name__ == "__main__":
    fix_users()
