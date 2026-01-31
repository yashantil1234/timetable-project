from extensions import db

class Faculty(db.Model):
    __tablename__ = "faculty"
    faculty_id = db.Column(db.Integer, primary_key=True)
    faculty_name = db.Column(db.String(100), nullable=False)
    max_hours = db.Column(db.Integer, default=12)
    dept_id = db.Column(db.Integer, db.ForeignKey("departments.id"))
    email = db.Column(db.String(100), nullable=True)
