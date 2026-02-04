
import sqlite3

def check_schema():
    conn = sqlite3.connect('timetable_enhanced.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(swap_requests)")
    columns = cursor.fetchall()
    print("Columns in swap_requests table:")
    for col in columns:
        print(col)
    conn.close()

if __name__ == "__main__":
    check_schema()
