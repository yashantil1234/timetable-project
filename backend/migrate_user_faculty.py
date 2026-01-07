from backend import app, db, User, Faculty

def migrate_user_faculty_links():
    """One-time migration to link User accounts with Faculty records"""
    with app.app_context():
        try:
            teachers = User.query.filter_by(role='teacher').all()
            linked_count = 0
            
            for teacher in teachers:
                faculty = Faculty.query.filter_by(faculty_name=teacher.username).first()
                if faculty and not faculty.user_id:
                    faculty.user_id = teacher.id
                    db.session.add(faculty)
                    linked_count += 1
                    print(f"Linked teacher '{teacher.username}' to faculty '{faculty.faculty_name}'")
            
            db.session.commit()
            print(f"Migration completed: {linked_count} teachers linked to faculty records")
            
        except Exception as e:
            print(f"Migration failed: {e}")
            db.session.rollback()

if __name__ == "__main__":
    migrate_user_faculty_links()