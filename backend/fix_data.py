
from app import create_app
from extensions import db
from models import Course

app = create_app()

with app.app_context():
    print("Updating courses to Dept ID 1 (Computer Science)...")
    courses = Course.query.all()
    for c in courses:
        print(f"Moving {c.name} (was Dept {c.dept_id}) to Dept 1")
        c.dept_id = 1
    
    db.session.commit()
    print("Courses updated.")
