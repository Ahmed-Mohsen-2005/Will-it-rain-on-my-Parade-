from fastapi import FastAPI, HTTPException
from datetime import datetime

app = FastAPI(title="Will-it-rain-on-my-Parade (FastAPI Backend)")
@app.get("/")
def root():
    return {"message": "FastAPI backend is running 🚀"}
@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.get("/api/weather")
async def get_weather():
    return {"message": "Weather endpoint (stub)"}

@app.get("/api/weather/history")
async def get_weather_history():
    return {"message": "Weather history (stub)"}

@app.get("/api/weather/patterns")
async def get_weather_patterns():
    return {"message": "Weather patterns (stub)"}

@app.get("/api/weather/ai-prediction")
async def get_weather_ai():
    return {"message": "AI weather prediction (stub)"}


@app.get("/api/satellite/imagery")
async def get_satellite_imagery():
    return {"message": "Satellite imagery (stub)"}


@app.get("/api/geocode")
async def geocode(address: str):
    return {"address": address, "lat": 30.0444, "lon": 31.2357}  # Cairo stub


@app.get("/api/user/profile")
async def get_user_profile():
    return {"message": "User profile (stub)"}

@app.get("/api/user/locations")
async def get_user_locations():
    return {"message": "User locations (stub)"}

@app.get("/api/user/alerts")
async def get_user_alerts():
    return {"message": "User alerts list (stub)"}

@app.get("/api/user/alerts/{id}")
async def get_user_alert(id: int):
    return {"alert_id": id, "message": "Single alert (stub)"}