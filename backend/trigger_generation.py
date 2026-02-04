
import requests

url = "http://localhost:5000/generate_timetable"
try:
    response = requests.post(url)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    try:
        err = response.json().get('error')
        print("JSON Error:", err)
        with open("generation_error.txt", "w") as f:
            f.write(str(err))
    except:
        with open("generation_error.txt", "w") as f:
            f.write(response.text)
except Exception as e:
    print(f"Error: {e}")
