"""
Check and add subject column to all database files
"""
import sqlite3
import os

# Check both possible database locations
db_paths = [
    "instance/timetable.db",
    "timetable_enhanced.db",
    "timetable_enhanced-DELL.db"
]

print("="*70)
print("DATABASE SUBJECT COLUMN MIGRATION")
print("="*70)

found_db = False

for db_path in db_paths:
    if not os.path.exists(db_path):
        print(f"\n✗ Skipping {db_path} (not found)")
        continue
    
    found_db = True
    print(f"\n{'='*70}")
    print(f"Processing: {db_path}")
    print(f"{'='*70}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check current structure
    print("\n1. Current faculty table structure:")
    cursor.execute("PRAGMA table_info(faculty)")
    columns = cursor.fetchall()
    for col in columns:
        print(f"   - {col[1]:15s} {col[2]}")
    
    column_names = [col[1] for col in columns]
    
    # Add column if missing
    if 'subject' not in column_names:
        print("\n2. Adding 'subject' column...")
        try:
            cursor.execute("ALTER TABLE faculty ADD COLUMN subject VARCHAR(100)")
            conn.commit()
            print("   ✓ Column added successfully!")
        except Exception as e:
            print(f"   ✗ Error: {e}")
    else:
        print("\n2. ✓ Subject column already exists")
    
    #Verify final structure
    print("\n3. Final structure:")
    cursor.execute("PRAGMA table_info(faculty)")
    columns = cursor.fetchall()
    for col in columns:
        marker = "  <-- ADDED" if col[1] == 'subject' else ""
        print(f"   - {col[1]:15s} {col[2]}{marker}")
    
    conn.close()

print("\n" + "="*70)
if found_db:
    print("\n✓ Migration complete!")
    print("\nNEXT STEPS:")
    print("1. STOP ALL running backend servers (Ctrl+C in terminals)")
    print("2. Start only ONE: python app.py")
    print("3. Refresh browser (Ctrl+Shift+R)")
else:
    print("\n✗ No database files found!")
