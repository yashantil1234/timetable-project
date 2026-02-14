"""
Import data from JSON export to PostgreSQL database
Run this script after deploying to production with PostgreSQL
"""
import json
import os
from app import create_app, db
from sqlalchemy import text

def import_database(json_file='database_export.json'):
    """Import data from JSON to PostgreSQL"""
    
    # Create app with production config
    app = create_app('production')
    
    with app.app_context():
        print("Loading export data...")
        with open(json_file, 'r', encoding='utf-8') as f:
            export_data = json.load(f)
        
        print(f"Export date: {export_data['export_date']}")
        print(f"Tables to import: {len(export_data['tables'])}")
        
        # Create all tables first
        print("\nCreating database tables...")
        db.create_all()
        print("✓ Tables created")
        
        # Import data for each table
        for table_name, table_info in export_data['tables'].items():
            rows = table_info['data']
            if not rows:
                print(f"\n⊘ Skipping {table_name} (no data)")
                continue
            
            print(f"\n📥 Importing {table_name} ({table_info['row_count']} rows)...")
            
            try:
                # Get column names from first row
                columns = list(rows[0].keys())
                
                # Build INSERT statement
                placeholders = ', '.join([f':{col}' for col in columns])
                insert_sql = f"INSERT INTO {table_name} ({', '.join(columns)}) VALUES ({placeholders})"
                
                # Insert all rows
                for row in rows:
                    db.session.execute(text(insert_sql), row)
                
                db.session.commit()
                print(f"  ✓ Imported {len(rows)} rows")
                
            except Exception as e:
                db.session.rollback()
                print(f"  ✗ Error importing {table_name}: {str(e)}")
                print(f"    You may need to manually import this table")
        
        print("\n✅ Import complete!")
        print("\n⚠️  Important: Verify data integrity and test all features")

if __name__ == "__main__":
    import sys
    
    json_file = sys.argv[1] if len(sys.argv) > 1 else 'database_export.json'
    
    if not os.path.exists(json_file):
        print(f"❌ Error: {json_file} not found!")
        print("Run export_sqlite_data.py first to create the export file")
        sys.exit(1)
    
    print("=" * 60)
    print("PostgreSQL Database Import")
    print("=" * 60)
    print("\n⚠️  WARNING: This will import data into your production database")
    print("Make sure DATABASE_URL environment variable is set correctly\n")
    
    confirm = input("Continue? (yes/no): ")
    if confirm.lower() == 'yes':
        import_database(json_file)
    else:
        print("Import cancelled")
