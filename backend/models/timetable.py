from extensions import db

class Timetable(db.Model):
    __tablename__ = "timetable"
    timetable_id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.course_id"))
    section_id = db.Column(db.Integer, db.ForeignKey("sections.id"))
    faculty_id = db.Column(db.Integer, db.ForeignKey("faculty.faculty_id"))
    room_id = db.Column(db.Integer, db.ForeignKey("classrooms.room_id"))
    day = db.Column(db.String(20))
    start_time = db.Column(db.String(20))

    course = db.relationship("Course")
    faculty = db.relationship("Faculty")
    room = db.relationship("Classroom")
