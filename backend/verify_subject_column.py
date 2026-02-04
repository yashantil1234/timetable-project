"""
Verify subject column exists in faculty table
"""
import sqlite3

db_path = "instance/timetable.db"

print("=== Verifying faculty table structure ===\n")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get table info
    cursor.execute("PRAGMA table_info(faculty)")
    columns = cursor.fetchall()
    
    print("Columns in faculty table:")
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
    
    # Check for subject column
    column_names = [col[1] for col in columns]
    if 'subject' in column_names:
        print("\n✓ Subject column EXISTS")
    else:
        print("\n✗ Subject column MISSING")
    
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
