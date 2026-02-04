import requests
import json

base_url = "http://localhost:5000"

print("=== Testing Faculty API Endpoints ===\n")

# Test 1: GET /admin/faculty
print("1. Testing GET /admin/faculty (fetch all faculty)...")
try:
    response = requests.get(f"{base_url}/admin/faculty")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Response: {json.dumps(data, indent=2)}")
    else:
        print(f"   Error: {response.text}")
except Exception as e:
    print(f"   Exception: {e}")

print("\n" + "="*50 + "\n")

# Test 2: POST /admin/faculty (add new faculty)
print("2. Testing POST /admin/faculty (add new faculty)...")
test_faculty = {
    "faculty_name": "Test Teacher",
    "dept_name": "Computer Science",
    "email": "test@test.com",
    "max_hours": 12
}
try:
    response = requests.post(
        f"{base_url}/admin/faculty",
        json=test_faculty,
        headers={"Content-Type": "application/json"}
    )
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text}")
except Exception as e:
    print(f"   Exception: {e}")
