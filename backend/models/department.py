from extensions import db

class Department(db.Model):
    __tablename__ = "departments"
    id = db.Column(db.Integer, primary_key=True)
    dept_name = db.Column(db.String(100), nullable=False, unique=True)

    faculty = db.relationship("Faculty", backref="department", lazy=True)
    courses = db.relationship("Course", backref="department", lazy=True)
    course_allocations = db.relationship("CourseAllocation", backref="department", lazy=True)
    sections = db.relationship("Section", backref="department", lazy=True)
    users = db.relationship("User", backref="department", lazy=True)
