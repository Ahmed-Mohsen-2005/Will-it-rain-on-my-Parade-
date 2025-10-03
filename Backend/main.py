from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import pandas as pd
import io

app = FastAPI(title="Will it Rain Backend 🌧️")

# Demo/mock data (you can replace with real weather API later)
mock_data = [
    {"city": "Cairo", "temperature": 32, "rain": "No"},
    {"city": "Alexandria", "temperature": 28, "rain": "Yes"},
    {"city": "Giza", "temperature": 30, "rain": "No"},
]

@app.get("/")
def root():
    return {"message": "FastAPI backend running 🚀"}

# Return mock data in JSON
@app.get("/data")
def get_data():
    return {"data": mock_data}

# Export mock data as CSV
@app.get("/data/csv")
def export_csv():
    df = pd.DataFrame(mock_data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=data.csv"
    return response

# Simple chatbot endpoint
@app.post("/chat")
def chatbot(message: dict):
    user_msg = message.get("text", "")
    reply = f"🤖 Bot: You said '{user_msg}'"
    return {"reply": reply}
