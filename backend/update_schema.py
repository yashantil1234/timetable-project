
from app import create_app
from extensions import db
import sqlalchemy as sa
from sqlalchemy import text

def update_schema():
    app = create_app()
    with app.app_context():
        engine = db.engine
        inspector = sa.inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('users')]
        
        with engine.connect() as conn:
            if 'phone' not in columns:
                print("Adding phone column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(20)"))
            
            if 'roll_number' not in columns:
                print("Adding roll_number column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN roll_number VARCHAR(20)"))
                
            if 'attendance' not in columns:
                print("Adding attendance column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN attendance FLOAT DEFAULT 0.0"))
            
            conn.commit()
            print("Schema update complete.")

if __name__ == "__main__":
    update_schema()
