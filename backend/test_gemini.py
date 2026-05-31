import urllib.request
import urllib.error
import json
import os

# Load dotenv key
env_vars = {}
try:
    with open('.env', 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                key, val = line.split('=', 1)
                env_vars[key.strip()] = val.strip()
except Exception as e:
    print("Error reading .env:", e)

GEMINI_API_KEY = env_vars.get('GEMINI_API_KEY')
print("Gemini API Key loaded:", GEMINI_API_KEY[:10] + "..." if GEMINI_API_KEY else "None")

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={GEMINI_API_KEY}"
payload = {
    "contents": [{
        "parts": [{"text": "Hello, respond with 'Success'."}]
    }]
}

try:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req) as response:
        print("Success! Status code:", response.status)
        print("Response body:", response.read().decode('utf-8')[:200])
except urllib.error.HTTPError as e:
    print("HTTPError Status:", e.code)
    print("HTTPError Response:", e.read().decode('utf-8'))
except Exception as e:
    print("General Error Type:", type(e))
    print("General Error Message:", str(e))
