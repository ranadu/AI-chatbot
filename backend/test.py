import requests

res = requests.post("http://127.0.0.1:8000/chat", json={
    "user": "robert",
    "message": "Tell me a joke"
})

print("Status:", res.status_code)
print("Response:", res.json())