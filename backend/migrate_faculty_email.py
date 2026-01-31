#!/usr/bin/env python3
"""
Migration script to add 'email' column to the faculty table.
This script handles the database schema change for the faculty model.
"""

import sqlite3
import os

def migrate_faculty_email():
    """Add email column to faculty table if it doesn't exist"""

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

        # Check if the 'email' column exists
        cursor.execute("PRAGMA table_info(faculty)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]

        if 'email' not in column_names:
            print("Adding 'email' column to faculty table...")

            # SQLite 3.1.0+ supports ALTER TABLE ADD COLUMN
            cursor.execute('''
                ALTER TABLE faculty 
                ADD COLUMN email TEXT
            ''')

            # Commit the changes
            conn.commit()

            print("Migration completed successfully!")
            return True

        else:
            print("Migration already completed - 'email' column exists.")
            return True

    except Exception as e:
        print(f"Migration failed: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
        return False

    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    success = migrate_faculty_email()
    if success:
        print("[SUCCESS] Database migration completed successfully!")
    else:
        print("[ERROR] Database migration failed!")
