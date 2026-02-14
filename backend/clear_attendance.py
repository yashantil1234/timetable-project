from app import create_app
from extensions import db
from models import Attendance

app = create_app()
with app.app_context():
    try:
        num_deleted = db.session.query(Attendance).delete()
        db.session.commit()
        print(f"Successfully deleted {num_deleted} attendance records.")
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting records: {e}")
