"""
Add subject column to faculty table
"""
import sqlite3

db_path = "instance/timetable.db"

print("=== Adding subject column to faculty table ===\n")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if column already exists
    cursor.execute("PRAGMA table_info(faculty)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'subject' in columns:
        print("Subject column already exists!")
    else:
        # Add the column
        cursor.execute("ALTER TABLE faculty ADD COLUMN subject VARCHAR(100)")
        conn.commit()
        print("✓ Successfully added 'subject' column to faculty table")
    
    conn.close()
    print("\nMigration complete!")
    
except Exception as e:
    print(f"Error: {e}")
