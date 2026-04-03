from app import create_app
from extensions import db
from models.assignment import Assignment

app = create_app()
with app.app_context():
    try:
        db.create_all()
        print("Success: Database tables (including Assignments) initialized/updated.")
    except Exception as e:
        print(f"Error: {e}")
