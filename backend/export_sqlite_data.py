"""
Export data from SQLite database to JSON format for migration to PostgreSQL
"""
import json
import sqlite3
from datetime import datetime

def export_database(db_path='timetable_enhanced.db', output_file='database_export.json'):
    """Export all tables from SQLite to JSON"""
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    tables = [row[0] for row in cursor.fetchall()]
    
    export_data = {
        'export_date': datetime.now().isoformat(),
        'tables': {}
    }
    
    print(f"Exporting {len(tables)} tables from {db_path}...")
    
    for table in tables:
        print(f"  Exporting table: {table}")
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        
        # Convert rows to dictionaries
        table_data = []
        for row in rows:
            table_data.append(dict(row))
        
        export_data['tables'][table] = {
            'row_count': len(table_data),
            'data': table_data
        }
        print(f"    ✓ Exported {len(table_data)} rows")
    
    # Save to JSON file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(export_data, f, indent=2, default=str)
    
    conn.close()
    
    print(f"\n✅ Export complete! Data saved to: {output_file}")
    print(f"Total tables exported: {len(tables)}")
    print(f"Total rows: {sum(t['row_count'] for t in export_data['tables'].values())}")
    
    return export_data

if __name__ == "__main__":
    export_database()
