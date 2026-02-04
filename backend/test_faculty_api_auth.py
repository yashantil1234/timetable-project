import requests
import json

base_url = "http://localhost:5000"

print("=== Testing Faculty API with Authentication ===\n")

# Try different admin credentials
credentials_to_try = [
    ("admin", "password123"),
    ("admin", "admin"),
    ("admin", "adminpassword"),
]

token = None

for username, password in credentials_to_try:
    print(f"Trying login with {username}/{password}...")
    login_response = requests.post(
        f"{base_url}/api/admin/login",
        json={"username": username, "password": password},
        headers={"Content-Type": "application/json"}
    )
    
    if login_response.status_code == 200:
        login_data = login_response.json()
        token = login_data.get('token')
        print(f"  SUCCESS: Got token with {username}/{password}\n")
        break
    else:
        print(f"  FAILED: {login_response.status_code}")

if not token:
    print("\nERROR: Could not login with any credentials!")
    print("The backend might need to have sample data created first.")
    exit(1)

# Step 2: Fetch faculty with authentication
print("2. Fetching faculty list...")
faculty_response = requests.get(
    f"{base_url}/admin/faculty",
    headers={"x-access-token": token}
)

print(f"  Status: {faculty_response.status_code}")

if faculty_response.status_code == 200:
    faculty_data = faculty_response.json()
    print(f"  SUCCESS: Received {len(faculty_data)} faculty members\n")
    if faculty_data:
        for f in faculty_data:
            print(f"    - ID:{f.get('id')} {f.get('name')} ({f.get('dept_name')}) - {f.get('email', 'No email')}")
    else:
        print("    (No faculty in response)")
else:
    print(f"  ERROR: {faculty_response.text}")
