
import sys
import os

# Add current directory to path just in case
sys.path.append(os.getcwd())

print("Attempting imports...")
try:
    from app import app
    print("SUCCESS: App imported")
    from extensions import db
    print("SUCCESS: DB imported")
    from models import User, Resource, Notification
    print("SUCCESS: Models imported")
except Exception as e:
    print(f"FAILURE: {e}")
    import traceback
    traceback.print_exc()
