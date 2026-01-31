#!/usr/bin/env python3
"""
Migration script to add 'proposed_start_time' column to the swap_requests table.
This script handles the database schema change for the swap_request model.
"""

import sqlite3
import os

def migrate_swap_request_proposed_start_time():
    """Add proposed_start_time column to swap_requests table"""

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

        # Check if the 'proposed_start_time' column exists
        cursor.execute("PRAGMA table_info(swap_requests)")
        columns = cursor.fetchall()
        column_names = [col[1] for col in columns]

        if 'proposed_start_time' not in column_names:
            print("Adding 'proposed_start_time' column to swap_requests table...")

            # Add the column
            cursor.execute('''
                ALTER TABLE swap_requests ADD COLUMN proposed_start_time TEXT NOT NULL DEFAULT ''
            ''')

            # Commit the changes
            conn.commit()

            print("Migration completed successfully!")
            return True

        else:
            print("Migration already completed - 'proposed_start_time' column exists.")
            return True

    except Exception as e:
        print(f"Migration failed: {str(e)}")
        conn.rollback()
        return False

    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    success = migrate_swap_request_proposed_start_time()
    if success:
        print("✅ Database migration completed successfully!")
    else:
        print("❌ Database migration failed!")
