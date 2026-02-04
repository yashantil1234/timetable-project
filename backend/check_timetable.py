from models import Timetable
from app import create_app

app = create_app()
with app.app_context():
    entries = Timetable.query.all()
    print(f"Total entries: {len(entries)}")
    if entries:
        print("Sample entry:")
        t = entries[0]
        print(f"Day: '{t.day}', Start Time: '{t.start_time}'")
        print(f"Course: {t.course.name if t.course else 'None'}")
