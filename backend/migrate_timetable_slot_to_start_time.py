#!/usr/bin/env python3
"""
Migration script to rename 'slot' column to 'start_time' in the timetable table.
This script handles the database schema change for the timetable model.
"""

import sqlite3
import os

def migrate_timetable_slot_to_start_time():
    """Migrate the timetable table to rename 'slot' column to 'start_time'"""

    # Database path
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(base_dir, "timetable_enhanced.db")

    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return False

    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if the 'slot' column exists and 'start_time' column doesn't exist
        cursor.execute("PRAGMA table_info(timetable)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]

        if 'slot' in column_names and 'start_time' not in column_names:
            print("Migrating 'slot' column to 'start_time'...")

            # SQLite doesn't support direct column renaming, so we need to:
            # 1. Create a new table with the correct schema
            # 2. Copy data from old table to new table
            # 3. Drop old table
            # 4. Rename new table to old table name

            # Step 1: Create new table with correct schema
            cursor.execute('''
                CREATE TABLE timetable_new (
                    timetable_id INTEGER PRIMARY KEY,
                    course_id INTEGER,
                    section_id INTEGER,
                    faculty_id INTEGER,
                    room_id INTEGER,
                    day TEXT,
                    start_time TEXT,
                    FOREIGN KEY (course_id) REFERENCES courses (course_id),
                    FOREIGN KEY (section_id) REFERENCES sections (id),
                    FOREIGN KEY (faculty_id) REFERENCES faculty (faculty_id),
                    FOREIGN KEY (room_id) REFERENCES classrooms (room_id)
                )
            ''')

            # Step 2: Copy data from old table to new table
            cursor.execute('''
                INSERT INTO timetable_new (timetable_id, course_id, section_id, faculty_id, room_id, day, start_time)
                SELECT timetable_id, course_id, section_id, faculty_id, room_id, day, slot
                FROM timetable
            ''')

            # Step 3: Drop old table
            cursor.execute('DROP TABLE timetable')

            # Step 4: Rename new table to old table name
            cursor.execute('ALTER TABLE timetable_new RENAME TO timetable')

            # Commit the changes
            conn.commit()

            print("Migration completed successfully!")
            return True

        elif 'start_time' in column_names:
            print("Migration already completed - 'start_time' column exists.")
            return True

        else:
            print("Unexpected database state. Please check the schema manually.")
            return False

    except Exception as e:
        print(f"Migration failed: {str(e)}")
        conn.rollback()
        return False

    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    success = migrate_timetable_slot_to_start_time()
    if success:
        print("✅ Database migration completed successfully!")
    else:
        print("❌ Database migration failed!")
