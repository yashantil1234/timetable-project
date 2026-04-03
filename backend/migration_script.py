import sqlite3
import os

# Database Path (Relative to backend folder)
db_path = 'timetable_enhanced.db'

def run_migration():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}. No migration needed.")
        return

    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print(f"Migrating database: {db_path}...")

        # Add is_swapped column
        try:
            cursor.execute("ALTER TABLE timetable ADD COLUMN is_swapped BOOLEAN DEFAULT 0")
            print("Added 'is_swapped' column.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("'is_swapped' column already exists.")
            else:
                print(f"Error adding 'is_swapped': {e}")

        # Add swapped_at column
        try:
            cursor.execute("ALTER TABLE timetable ADD COLUMN swapped_at DATETIME")
            print("Added 'swapped_at' column.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("'swapped_at' column already exists.")
            else:
                print(f"Error adding 'swapped_at': {e}")

        # Add swapped_by_id column
        try:
            cursor.execute("ALTER TABLE timetable ADD COLUMN swapped_by_id INTEGER REFERENCES users(id)")
            print("Added 'swapped_by_id' column.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("'swapped_by_id' column already exists.")
            else:
                print(f"Error adding 'swapped_by_id': {e}")

        # Add swap_group_id column
        try:
            cursor.execute("ALTER TABLE timetable ADD COLUMN swap_group_id VARCHAR(50)")
            print("Added 'swap_group_id' column.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("'swap_group_id' column already exists.")
            else:
                print(f"Error adding 'swap_group_id': {e}")

        # Add swapped_with_course column
        try:
            cursor.execute("ALTER TABLE timetable ADD COLUMN swapped_with_course VARCHAR(100)")
            print("Added 'swapped_with_course' column.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("'swapped_with_course' column already exists.")
            else:
                print(f"Error adding 'swapped_with_course': {e}")

        conn.commit()
        conn.close()
        print("Migration complete!")

    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
