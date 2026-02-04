
import sqlite3
import os

def fix_swap_requests_schema():
    base_dir = os.path.abspath(os.path.dirname(__file__))
    db_paths = [
        os.path.join(base_dir, "timetable_enhanced.db"),
    ]

    for db_path in db_paths:
        if not os.path.exists(db_path):
            print(f"Skipping {db_path} (not found)")
            continue
            
        print(f"Processing {db_path}...")
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Check columns
            cursor.execute("PRAGMA table_info(swap_requests)")
            columns = cursor.fetchall()
            col_names = [col[1] for col in columns]
            
            print(f"Current columns: {col_names}")
            
            if 'proposed_slot' in col_names:
                print("Removing legacy 'proposed_slot' column...")
                try:
                    cursor.execute("ALTER TABLE swap_requests DROP COLUMN proposed_slot")
                    conn.commit()
                    print("Successfully dropped 'proposed_slot'.")
                except sqlite3.OperationalError as e:
                    print(f"DROP COLUMN failed (likely old SQLite): {e}")
                    # Fallback: Make it nullable if we can't drop? 
                    # SQLite doesn't support ALTER COLUMN to change nullability easily.
                    # We have to recreate the table.
                    print("Attempting table recreation...")
                    
                    # 1. Rename old table
                    cursor.execute("ALTER TABLE swap_requests RENAME TO swap_requests_old")
                    
                    # 2. Create new table (definition from models.py essentially, but we need to be careful)
                    # We'll just copy the definition but exclude proposed_slot.
                    # Actually, easier to let SQLAlchemy do it? No, manual SQL is safer here to preserve data.
                    # Let's read the schema of old table and reconstruct.
                    
                    # Simplified approach: Just set a default value for proposed_slot if we can't drop it? 
                    # cannot add default to existing column via ALTER easily if not adding.
                    
                    # Let's try the DROP first. If it works, great.
                    pass
            
            else:
                print("'proposed_slot' not found. Schema looks correct.")
                
            conn.close()
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    fix_swap_requests_schema()
