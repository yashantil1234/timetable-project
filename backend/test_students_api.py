"""
Test the students API endpoint to check if it's working
"""
import requests

BASE_URL = "http://localhost:5000"

# First login as admin
print("=" * 60)
print("Testing Students API")
print("=" * 60)

print("\n1. Logging in as admin...")
try:
    response = requests.post(
        f"{BASE_URL}/api/admin/login",
        json={"username": "admin", "password": "password123"}
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        token = data.get("token")
        print(f"✓ Login successful! Token received: {token[:20]}...")
    else:
        print(f"✗ Login failed: {response.text}")
        exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    exit(1)

# Test GET students
print("\n2. Getting students...")
try:
    response = requests.get(
        f"{BASE_URL}/admin/students",
        headers={"x-access-token": token}
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        students = response.json()
        print(f"✓ Success! Got {len(students)} students")
        if students:
            print("\nFirst student:")
            print(f"  - ID: {students[0].get('id')}")
            print(f"  - Username: {students[0].get('username')}")
            print(f"  - Full Name: {students[0].get('full_name')}")
            print(f"  - Department: {students[0].get('dept_name')}")
            print(f"  - Year: {students[0].get('year')}")
            print(f"  - Section: {students[0].get('section_name')}")
        else:
            print("  No students found in database")
    else:
        print(f"✗ Failed: {response.text}")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 60)
