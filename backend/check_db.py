
import sqlite3
import os

db_path = 'timetable_enhanced.db'
if not os.path.exists(db_path):
    print(f"Database file {db_path} not found.")
else:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    names = [row[0] for row in cursor.fetchall()]
    with open("db_tables.txt", "w") as f:
        f.write("\n".join(names))
    print("Tables written to db_tables.txt")
    
    # Based on findings, try to count
    possible_tables = ['room', 'rooms', 'classroom', 'classrooms', 'course_allocation', 'course_allocations', 'allocation', 'allocations', 'faculty_unavailability', 'faculty_unavailabilities', 'unavailability']
    
    print("\nDatabase Table Counts (Round 3):")
    for table in possible_tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"{table}: {count}")
        except sqlite3.OperationalError:
            pass # Table not found
            
    conn.close()
