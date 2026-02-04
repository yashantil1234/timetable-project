import pandas as pd
from app import create_app
from extensions import db
from models import Faculty, Department

app = create_app()

with app.app_context():
    print("=== Importing Faculty from CSV ===\n")
    
    # Read the CSV file
    csv_path = "data/faculty.csv"
    df = pd.read_csv(csv_path)
    
    print(f"Found {len(df)} rows in CSV")
    
    added = 0
    skipped = 0
    
    for _, row in df.iterrows():
        faculty_name = str(row['faculty_name']).strip()
        dept_name = str(row['dept_name']).strip()
        max_hours = int(row['max_hours']) if pd.notna(row['max_hours']) else 12
        email = str(row['email']).strip() if pd.notna(row['email']) else None
        
        # Check if faculty already exists
        existing = Faculty.query.filter_by(faculty_name=faculty_name).first()
        if existing:
            print(f"  SKIP: {faculty_name} (already exists)")
            skipped += 1
            continue
        
        # Find department
        dept = Department.query.filter_by(dept_name=dept_name).first()
        if not dept:
            print(f"  ERROR: Department '{dept_name}' not found for {faculty_name}")
            skipped += 1
            continue
        
        # Add faculty
        faculty = Faculty(
            faculty_name=faculty_name,
            max_hours=max_hours,
            dept_id=dept.id,
            email=email
        )
        db.session.add(faculty)
        print(f"  ADD: {faculty_name} -> {dept_name}")
        added += 1
    
    db.session.commit()
    
    print(f"\n=== Import Complete ===")
    print(f"Added: {added}")
    print(f"Skipped: {skipped}")
    print(f"\nTotal faculty in database: {Faculty.query.count()}")
