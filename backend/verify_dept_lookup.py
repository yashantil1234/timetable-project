
import requests
import json

base_url = "http://localhost:5000"

# 1. Login to get token
login_data = {
    "username": "admin",
    "password": "adminpassword" # Assuming default admin credentials, if fails I'll check user table
}
# First check if admin user exists with this password, or create one. 
# actually for reproduction let's just use a script that sets up a temporary admin if needed.
# But wait, I can just use the token from the browser? No I don't have access to browser storage easily.
# I'll rely on the fact that I can create a token locally if I needed to, but let's try logging in.

# Actually, I can use the trick of looking at the User model to find a valid user or just insert one.
# Re-using the generate_timetable approach which didn't need auth? No, that was internal function call. Admin routes need token.

# Let's try to login. If it fails, I'll use app context to add faculty directly to verify DB constraint, 
# but testing the API is better.

# Alternative: Use "fix_data.py" approach to add faculty via Python internal verification to prove "Chemistry" fails 
# finding the department.

from app import create_app
from models import Department, Faculty

app = create_app()

with app.app_context():
    print("--- Testing Department Lookup ---")
    
    dept_name = "Chemistry"
    print(f"Looking for '{dept_name}'...")
    dept = Department.query.filter_by(dept_name=dept_name).first()
    if not dept:
        print(f"FAILURE: Department '{dept_name}' not found in DB.")
    else:
        print(f"SUCCESS: Found '{dept_name}'.")

    dept_name = "Computer Science"
    print(f"Looking for '{dept_name}'...")
    dept = Department.query.filter_by(dept_name=dept_name).first()
    if not dept:
        print(f"FAILURE: Department '{dept_name}' not found in DB.")
    else:
        print(f"SUCCESS: Found '{dept_name}' (ID: {dept.id}).")
        
    print("\n--- Conclusion ---")
    print("If the frontend sends 'Chemistry', the backend will REJECT it because the department lookup fails.")
