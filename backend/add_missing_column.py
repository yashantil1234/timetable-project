

import sqlite3
import os

DB_PATH = os.path.join('timetable_enhanced.db')

def update_schema():
    print(f"Checking database at {DB_PATH}")
    if not os.path.exists(DB_PATH):
        print("Database file not found!")
        return

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check current columns
        cursor.execute("PRAGMA table_info(swap_requests)")
        columns_info = cursor.fetchall()
        columns = [info[1] for info in columns_info]
        print(f"Current columns: {columns}")
        
        if 'proposed_start_time' not in columns:
            print("Adding column 'proposed_start_time'...")
            cursor.execute('ALTER TABLE swap_requests ADD COLUMN proposed_start_time TEXT')
            conn.commit()
            print("Column added successfully.")
        else:
            print("Column 'proposed_start_time' already exists.")
            
        conn.close()
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    update_schema()

