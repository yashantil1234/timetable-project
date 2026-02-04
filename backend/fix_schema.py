
from extensions import db
from app import create_app
from models.faculty_unavailability import FacultyUnavailability
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("Dropping faculty_unavailability table...")
    # Using text() for raw SQL to be sure
    db.session.execute(text("DROP TABLE IF EXISTS faculty_unavailability"))
    db.session.commit()
    print("Dropped.")
    
    print("Recreating tables...")
    db.create_all()
    print("Done.")
