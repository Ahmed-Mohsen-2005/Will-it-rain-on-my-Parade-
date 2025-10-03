from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import pandas as pd
import json
import random
import asyncio
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import io
import csv

# Load environment variables
load_dotenv()

app = FastAPI(title="Weather Prediction API", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enhanced Pydantic models
class Address(BaseModel):
    city: str
    state: str
    country: str
    countryCode: str

class LocationRequest(BaseModel):
    latitude: float
    longitude: float
    location_name: str
    address: Optional[Address] = None

class GeoCodeResponse(BaseModel):
    name: str
    latitude: float
    longitude: float
    address: Address

class RiskAnalysis(BaseModel):
    precipitationRisk: Dict[str, str]
    windImpact: Dict[str, str]
    temperatureComfort: Dict[str, str]

class Recommendations(BaseModel):
    weatherAdvisory: str
    optimalTiming: str
    backupPlans: str

class HourlyForecast(BaseModel):
    time: str
    temperature: float
    precipitation: float
    conditions: str

class WeatherData(BaseModel):
    city: str
    country: str
    latitude: float
    longitude: float
    address: Address
    date: str
    eventType: str
    temperature: float
    humidity: float
    windSpeed: float
    precipitation: float
    conditions: str
    riskLevel: str
    recommendations: Recommendations
    riskAnalysis: RiskAnalysis
    hourlyForecast: List[HourlyForecast]

class WeatherAlert(BaseModel):
    id: str
    user_id: str
    location: str
    latitude: float
    longitude: float
    alert_type: str
    threshold: float
    condition: str
    is_active: bool
    created_at: str
    description: str

class UserLocation(BaseModel):
    id: str
    name: str
    address: str
    latitude: float
    longitude: float
    city: str
    state: str
    country: str
    countryCode: str
    isDefault: bool

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    profile: Dict[str, Any]
    locations: List[UserLocation]
    alerts: List[WeatherAlert]

class ChatMessage(BaseModel):
    message: str
    user_id: Optional[str] = None

class AIPredictionRequest(BaseModel):
    latitude: float
    longitude: float
    date: str
    eventType: str
    currentConditions: Dict[str, Any]

class SatelliteImageryRequest(BaseModel):
    latitude: float
    longitude: float
    date: str
    imageryType: str
    resolution: str

class WeatherPatternsRequest(BaseModel):
    latitude: float
    longitude: float
    date: str
    patternType: str

# Data storage
weather_data_store = []
alerts_store = []
users_store = []
locations_store = []

# Event types for different activities
EVENT_TYPES = ["wedding", "outdoor", "concert", "parade", "sports"]

# Load existing data
def load_existing_data():
    global weather_data_store, alerts_store, users_store, locations_store
    
    # Load weather data
    try:
        weather_df = pd.read_csv("weather_data.csv")
        for _, row in weather_df.iterrows():
            # Generate additional data needed for the website
            event_type = random.choice(EVENT_TYPES)
            recommendations = generate_recommendations(row['conditions'], row['riskLevel'])
            risk_analysis = generate_risk_analysis(row)
            hourly_forecast = generate_hourly_forecast(row['date'], row['temperature'])
            
            address = Address(
                city=row.get('city', row['city']),
                state=row.get('state', ''),
                country=row.get('country', 'USA'),
                countryCode=row.get('countryCode', 'US')
            )
            
            weather_data = {
                "city": row['city'],
                "country": row.get('country', 'USA'),
                "latitude": row['latitude'],
                "longitude": row['longitude'],
                "address": address.dict(),
                "date": row['date'],
                "eventType": event_type,
                "temperature": row['temperature'],
                "humidity": row['humidity'],
                "windSpeed": row['windSpeed'],
                "precipitation": row['precipitation'],
                "conditions": row['conditions'],
                "riskLevel": row['riskLevel'],
                "recommendations": recommendations.dict(),
                "riskAnalysis": risk_analysis.dict(),
                "hourlyForecast": [hour.dict() for hour in hourly_forecast]
            }
            weather_data_store.append(weather_data)
    except FileNotFoundError:
        print("weather_data.csv not found, will generate sample data")
    
    # Load users
    try:
        users_df = pd.read_csv("users.csv")
        for _, row in users_df.iterrows():
            preferences = eval(row['preferences']) if isinstance(row['preferences'], str) else row['preferences']
            user = {
                "id": row['id'],
                "name": row['name'],
                "email": row['email'],
                "profile": preferences,
                "locations": [],
                "alerts": []
            }
            users_store.append(user)
    except FileNotFoundError:
        print("users.csv not found, will generate sample users")
    
    # Load alerts
    try:
        alerts_df = pd.read_csv("alerts.csv")
        for _, row in alerts_df.iterrows():
            alert = {
                "id": row['id'],
                "user_id": row['user_id'],
                "location": row['location'],
                "latitude": row['latitude'],
                "longitude": row['longitude'],
                "alert_type": row['alert_type'],
                "threshold": row['threshold'],
                "condition": row['condition'],
                "is_active": row['is_active'],
                "created_at": row['created_at'],
                "description": row['description']
            }
            alerts_store.append(alert)
    except FileNotFoundError:
        print("alerts.csv not found, will generate sample alerts")

# Generate recommendations based on weather conditions
def generate_recommendations(weather_condition: str, risk_level: str) -> Recommendations:
    condition_map = {
        "Sunny": "Perfect weather for outdoor activities. Consider sun protection.",
        "Cloudy": "Good conditions for most outdoor events. Light jacket recommended.",
        "Rainy": "Indoor activities recommended. Have backup plans ready.",
        "Stormy": "High risk - postpone outdoor activities. Seek shelter immediately.",
        "Light Rain": "Light rain expected. Waterproof clothing recommended.",
        "Overcast": "Overcast skies - good for photography, mild conditions.",
        "Snow": "Winter weather conditions. Dress warmly and be cautious of travel.",
        "Light Rain": "Drizzle expected - umbrella recommended but activities can proceed."
    }
    
    risk_map = {
        "Low": "Optimal conditions for planned activities.",
        "Medium": "Monitor conditions and have contingency plans ready.",
        "High": "Consider rescheduling or implementing safety measures.",
        "Critical": "High risk - postpone activities and prioritize safety."
    }
    
    timing_suggestions = {
        "Low": "Any time is suitable for outdoor activities.",
        "Medium": "Morning or late afternoon recommended for best conditions.",
        "High": "Early morning activities preferred, monitor weather updates.",
        "Critical": "Reschedule to a different day if possible."
    }
    
    backup_map = {
        "Low": "No backup plans needed.",
        "Medium": "Have indoor alternatives available.",
        "High": "Prepare indoor venue options and flexible scheduling.",
        "Critical": "Comprehensive backup plans essential, consider cancellation."
    }
    
    return Recommendations(
        weatherAdvisory=condition_map.get(weather_condition, "Monitor weather conditions."),
        optimalTiming=timing_suggestions.get(risk_level, "Check weather updates regularly."),
        backupPlans=backup_map.get(risk_level, "Have contingency plans ready.")
    )

# Generate risk analysis
def generate_risk_analysis(row) -> RiskAnalysis:
    temp = row['temperature']
    precip = row['precipitation']
    wind = row['windSpeed']
    
    # Precipitation risk
    if precip > 70:
        precip_level = "High"
        precip_desc = "Heavy precipitation likely, significant impact on activities"
    elif precip > 40:
        precip_level = "Medium"
        precip_desc = "Moderate precipitation expected, some impact on activities"
    else:
        precip_level = "Low"
        precip_desc = "Minimal precipitation expected, low impact on activities"
    
    # Wind impact
    if wind > 30:
        wind_level = "High"
        wind_desc = "Strong winds expected, high impact on outdoor activities"
    elif wind > 15:
        wind_level = "Medium"
        wind_desc = "Moderate winds, some impact on activities"
    else:
        wind_level = "Low"
        wind_desc = "Light winds, minimal impact on activities"
    
    # Temperature comfort
    if temp > 30:
        temp_level = "High"
        temp_desc = "Very hot conditions, heat stress risk"
    elif temp < 5:
        temp_level = "High"
        temp_desc = "Very cold conditions, hypothermia risk"
    elif 18 <= temp <= 25:
        temp_level = "Low"
        temp_desc = "Comfortable temperature range"
    else:
        temp_level = "Medium"
        temp_desc = "Moderate temperature, some discomfort possible"
    
    return RiskAnalysis(
        precipitationRisk={"level": precip_level, "description": precip_desc},
        windImpact={"level": wind_level, "description": wind_desc},
        temperatureComfort={"level": temp_level, "description": temp_desc}
    )

# Generate hourly forecast
def generate_hourly_forecast(date_str: str, base_temp: float) -> List[HourlyForecast]:
    hourly_data = []
    base_date = datetime.strptime(date_str, "%Y-%m-%d")
    
    conditions = ["Clear", "Cloudy", "Partly Cloudy", "Light Rain", "Overcast"]
    
    for hour in range(0, 24, 3):  # Every 3 hours
        time_str = f"{hour:02d}:00"
        # Temperature variation throughout the day
        temp_variation = random.uniform(-5, 5)
        temperature = base_temp + temp_variation
        precipitation = random.uniform(0, 100)
        condition = random.choice(conditions)
        
        hourly_data.append(HourlyForecast(
            time=time_str,
            temperature=round(temperature, 1),
            precipitation=round(precipitation, 1),
            conditions=condition
        ))
    
    return hourly_data

# Initialize data
load_existing_data()

# If no data loaded, generate sample data
if not weather_data_store:
    # Generate sample weather data
    locations = [
        {"name": "New York", "lat": 40.7128, "lon": -74.0060, "country": "USA", "state": "NY"},
        {"name": "Los Angeles", "lat": 34.0522, "lon": -118.2437, "country": "USA", "state": "CA"},
        {"name": "Chicago", "lat": 41.8781, "lon": -87.6298, "country": "USA", "state": "IL"},
        {"name": "Houston", "lat": 29.7604, "lon": -95.3698, "country": "USA", "state": "TX"},
        {"name": "Phoenix", "lat": 33.4484, "lon": -112.0740, "country": "USA", "state": "AZ"}
    ]
    
    weather_conditions = ["Sunny", "Cloudy", "Rainy", "Stormy", "Partly Cloudy", "Overcast", "Light Rain", "Snow"]
    risk_levels = ["Low", "Medium", "High", "Critical"]
    
    base_date = datetime.now()
    
    for location in locations:
        for i in range(30):  # 30 days of data
            date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
            temperature = random.uniform(-10, 40)
            humidity = random.uniform(20, 100)
            precipitation = random.uniform(0, 100)
            wind_speed = random.uniform(0, 50)
            condition = random.choice(weather_conditions)
            event_type = random.choice(EVENT_TYPES)
            
            # Calculate risk level
            if precipitation > 70 or wind_speed > 30 or temperature > 35 or temperature < -5:
                risk_level = "Critical"
            elif precipitation > 50 or wind_speed > 20 or temperature > 30 or temperature < 0:
                risk_level = "High"
            elif precipitation > 30 or wind_speed > 15 or temperature > 25 or temperature < 5:
                risk_level = "Medium"
            else:
                risk_level = "Low"
            
            address = Address(
                city=location["name"],
                state=location["state"],
                country=location["country"],
                countryCode="US"
            )
            
            recommendations = generate_recommendations(condition, risk_level)
            
            risk_analysis = RiskAnalysis(
                precipitationRisk={"level": "Medium", "description": "Moderate precipitation risk"},
                windImpact={"level": "Low", "description": "Minimal wind impact expected"},
                temperatureComfort={"level": "Medium", "description": "Moderate temperature conditions"}
            )
            
            hourly_forecast = generate_hourly_forecast(date, temperature)
            
            weather_data = {
                "city": location["name"],
                "country": location["country"],
                "latitude": location["lat"],
                "longitude": location["lon"],
                "address": address.dict(),
                "date": date,
                "eventType": event_type,
                "temperature": temperature,
                "humidity": humidity,
                "windSpeed": wind_speed,
                "precipitation": precipitation,
                "conditions": condition,
                "riskLevel": risk_level,
                "recommendations": recommendations.dict(),
                "riskAnalysis": risk_analysis.dict(),
                "hourlyForecast": [hour.dict() for hour in hourly_forecast]
            }
            weather_data_store.append(weather_data)

# API Endpoints

@app.get("/")
async def root():
    return {"message": "Weather Prediction API v2.0 is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat(), "version": "2.0.0"}

# Geocoding endpoint
@app.get("/api/geocode")
async def geocode_location(q: str = Query(..., description="Location query")):
    # Mock geocoding service
    locations = [
        {"name": "New York", "latitude": 40.7128, "longitude": -74.0060, "address": {"city": "New York", "state": "NY", "country": "USA", "countryCode": "US"}},
        {"name": "Los Angeles", "latitude": 34.0522, "longitude": -118.2437, "address": {"city": "Los Angeles", "state": "CA", "country": "USA", "countryCode": "US"}},
        {"name": "Chicago", "latitude": 41.8781, "longitude": -87.6298, "address": {"city": "Chicago", "state": "IL", "country": "USA", "countryCode": "US"}},
        {"name": "Houston", "latitude": 29.7604, "longitude": -95.3698, "address": {"city": "Houston", "state": "TX", "country": "USA", "countryCode": "US"}},
        {"name": "Phoenix", "latitude": 33.4484, "longitude": -112.0740, "address": {"city": "Phoenix", "state": "AZ", "country": "USA", "countryCode": "US"}}
    ]
    
    filtered_locations = [loc for loc in locations if q.lower() in loc["name"].lower()]
    return {"locations": filtered_locations}

# Main weather endpoint
@app.post("/api/weather")
async def get_weather_data(request: dict):
    latitude = request.get("latitude")
    longitude = request.get("longitude")
    date = request.get("date")
    
    if not all([latitude, longitude, date]):
        raise HTTPException(status_code=400, detail="Missing required parameters")
    
    # Find closest weather data
    closest_data = None
    min_distance = float('inf')
    
    for data in weather_data_store:
        distance = ((data["latitude"] - latitude)**2 + (data["longitude"] - longitude)**2)**0.5
        if distance < min_distance:
            min_distance = distance
            closest_data = data
    
    if not closest_data:
        # Generate new weather data if none found
        temperature = random.uniform(-10, 40)
        humidity = random.uniform(20, 100)
        precipitation = random.uniform(0, 100)
        wind_speed = random.uniform(0, 50)
        condition = random.choice(["Sunny", "Cloudy", "Rainy", "Stormy", "Partly Cloudy"])
        
        if precipitation > 70 or wind_speed > 30 or temperature > 35 or temperature < -5:
            risk_level = "Critical"
        elif precipitation > 50 or wind_speed > 20 or temperature > 30 or temperature < 0:
            risk_level = "High"
        elif precipitation > 30 or wind_speed > 15 or temperature > 25 or temperature < 5:
            risk_level = "Medium"
        else:
            risk_level = "Low"
        
        address = Address(
            city="Unknown",
            state="",
            country="USA",
            countryCode="US"
        )
        
        recommendations = generate_recommendations(condition, risk_level)
        risk_analysis = RiskAnalysis(
            precipitationRisk={"level": "Medium", "description": "Moderate precipitation risk"},
            windImpact={"level": "Low", "description": "Minimal wind impact expected"},
            temperatureComfort={"level": "Medium", "description": "Moderate temperature conditions"}
        )
        hourly_forecast = generate_hourly_forecast(date, temperature)
        
        closest_data = {
            "city": "Unknown",
            "country": "USA",
            "latitude": latitude,
            "longitude": longitude,
            "address": address.dict(),
            "date": date,
            "eventType": "outdoor",
            "temperature": temperature,
            "humidity": humidity,
            "windSpeed": wind_speed,
            "precipitation": precipitation,
            "conditions": condition,
            "riskLevel": risk_level,
            "recommendations": recommendations.dict(),
            "riskAnalysis": risk_analysis.dict(),
            "hourlyForecast": [hour.dict() for hour in hourly_forecast]
        }
    
    return closest_data

# AI Prediction endpoint
@app.post("/api/weather/ai-prediction")
async def get_ai_prediction(request: AIPredictionRequest):
    # Mock AI prediction using Z-AI SDK structure
    try:
        # In production, this would use the actual Z-AI SDK
        prediction = {
            "prediction": {
                "overallRisk": random.choice(["Low", "Medium", "High", "Critical"]),
                "confidence": round(random.uniform(0.7, 0.95), 2),
                "keyFactors": [
                    f"Temperature: {request.currentConditions.get('temperature', 'N/A')}°C",
                    f"Humidity: {request.currentConditions.get('humidity', 'N/A')}%",
                    f"Wind Speed: {request.currentConditions.get('windSpeed', 'N/A')} km/h",
                    f"Precipitation: {request.currentConditions.get('precipitation', 'N/A')}%"
                ],
                "recommendations": [
                    "Monitor weather conditions closely",
                    "Have indoor backup plans ready",
                    "Check for weather alerts in your area"
                ],
                "eventSpecificAdvice": {
                    "wedding": "Consider indoor venue or tent coverage",
                    "outdoor": "Postpone if severe weather expected",
                    "concert": "Ensure stage and equipment protection",
                    "parade": "Have rain contingency plans",
                    "sports": "Monitor player safety conditions"
                }.get(request.eventType, "Monitor conditions and plan accordingly")
            },
            "timestamp": datetime.now().isoformat(),
            "modelVersion": "z-ai-weather-v1.0"
        }
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI prediction error: {str(e)}")

# Satellite imagery endpoint
@app.post("/api/satellite/imagery")
async def get_satellite_imagery(request: SatelliteImageryRequest):
    # Mock satellite imagery data
    imagery_data = {
        "imageryType": request.imageryType,
        "resolution": request.resolution,
        "timestamp": datetime.now().isoformat(),
        "imageUrl": f"https://api.satellite.com/mock/{request.latitude}/{request.longitude}/{request.date}",
        "metadata": {
            "cloudCover": round(random.uniform(0, 100), 1),
            "visibility": round(random.uniform(1, 10), 1),
            "imageQuality": random.choice(["High", "Medium", "Low"]),
            "processingLevel": "Level 2"
        },
        "analysis": {
            "weatherSystems": [
                {
                    "type": random.choice(["Front", "Low Pressure", "High Pressure", "Storm System"]),
                    "intensity": random.choice(["Weak", "Moderate", "Strong"]),
                    "movement": random.choice(["Stationary", "Slow East", "Fast West", "North"])
                }
            ],
            "precipitationAreas": round(random.uniform(0, 100), 1),
            "temperatureAnomalies": round(random.uniform(-5, 5), 1)
        }
    }
    return imagery_data

# Weather patterns endpoint
@app.post("/api/weather/patterns")
async def get_weather_patterns(request: WeatherPatternsRequest):
    # Mock weather patterns analysis
    patterns_data = {
        "patternType": request.patternType,
        "location": {"latitude": request.latitude, "longitude": request.longitude},
        "date": request.date,
        "historicalPatterns": {
            "temperatureTrend": random.choice(["Warming", "Cooling", "Stable"]),
            "precipitationTrend": random.choice(["Increasing", "Decreasing", "Stable"]),
            "windPattern": random.choice(["Cyclonic", "Anticyclonic", "Variable"])
        },
        "seasonalPatterns": {
            "typicalWeather": random.choice(["Sunny and Dry", "Mixed Conditions", "Rainy Season", "Storm Season"]),
            "extremesLikelihood": round(random.uniform(0, 100), 1),
            "optimalPeriods": ["Spring", "Fall"] if random.random() > 0.5 else ["Summer", "Winter"]
        },
        "predictions": {
            "next7Days": {
                "temperatureChange": round(random.uniform(-10, 10), 1),
                "precipitationProbability": round(random.uniform(0, 100), 1),
                "dominantWeather": random.choice(["Sunny", "Cloudy", "Rainy", "Stormy"])
            }
        }
    }
    return patterns_data

# User profile endpoints
@app.get("/api/user/profile")
async def get_user_profile():
    # Mock user profile
    if users_store:
        user = users_store[0]  # Return first user for demo
        return user
    else:
        return {
            "id": "demo_user",
            "name": "Demo User",
            "email": "demo@example.com",
            "profile": {
                "temperature_unit": "celsius",
                "wind_speed_unit": "kmh",
                "default_location": "New York",
                "alert_notifications": True,
                "risk_threshold": "medium"
            },
            "locations": [],
            "alerts": []
        }

@app.put("/api/user/profile")
async def update_user_profile(profile_data: dict):
    # Mock profile update
    return {
        "id": "demo_user",
        "name": "Demo User",
        "email": "demo@example.com",
        "profile": profile_data.get("profile", {}),
        "locations": profile_data.get("locations", []),
        "alerts": profile_data.get("alerts", [])
    }

# User locations endpoints
@app.get("/api/user/locations")
async def get_user_locations():
    # Mock user locations
    return [
        {
            "id": "loc_001",
            "name": "Home",
            "address": "123 Main St, New York, NY",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "city": "New York",
            "state": "NY",
            "country": "USA",
            "countryCode": "US",
            "isDefault": True
        }
    ]

@app.post("/api/user/locations")
async def save_user_location(location_data: dict):
    # Mock save location
    return {
        "id": f"loc_{random.randint(1000, 9999)}",
        "name": location_data.get("name", "Unnamed Location"),
        "address": location_data.get("address", ""),
        "latitude": location_data.get("latitude"),
        "longitude": location_data.get("longitude"),
        "city": location_data.get("city", ""),
        "state": location_data.get("state", ""),
        "country": location_data.get("country", ""),
        "countryCode": location_data.get("countryCode", ""),
        "isDefault": location_data.get("isDefault", False)
    }

# User alerts endpoints
@app.get("/api/user/alerts")
async def get_user_alerts():
    # Mock user alerts
    return [
        {
            "id": "alert_001",
            "user_id": "demo_user",
            "location": "New York",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "alert_type": "temperature",
            "threshold": 30.0,
            "condition": "above",
            "is_active": True,
            "created_at": "2024-01-15T10:30:00Z",
            "description": "Alert when temperature exceeds 30°C"
        }
    ]

@app.post("/api/user/alerts")
async def create_weather_alert(alert_data: dict):
    # Mock create alert
    return {
        "id": f"alert_{random.randint(1000, 9999)}",
        "user_id": alert_data.get("user_id", "demo_user"),
        "location": alert_data.get("location", ""),
        "latitude": alert_data.get("latitude"),
        "longitude": alert_data.get("longitude"),
        "alert_type": alert_data.get("alert_type", ""),
        "threshold": alert_data.get("threshold"),
        "condition": alert_data.get("condition", ""),
        "is_active": True,
        "created_at": datetime.now().isoformat(),
        "description": alert_data.get("description", "")
    }

@app.delete("/api/user/alerts/{alert_id}")
async def delete_weather_alert(alert_id: str):
    # Mock delete alert
    return {"message": "Alert deleted successfully"}

# Weather history endpoint
@app.get("/api/weather/history")
async def get_weather_history(
    latitude: float = Query(...),
    longitude: float = Query(...),
    days: int = Query(30, ge=1, le=365)
):
    # Mock weather history
    history_data = []
    base_date = datetime.now() - timedelta(days=days)
    
    for i in range(days):
        date = (base_date + timedelta(days=i)).strftime("%Y-%m-%d")
        temperature = random.uniform(-10, 40)
        humidity = random.uniform(20, 100)
        precipitation = random.uniform(0, 100)
        wind_speed = random.uniform(0, 50)
        condition = random.choice(["Sunny", "Cloudy", "Rainy", "Stormy", "Partly Cloudy"])
        
        history_data.append({
            "date": date,
            "temperature": temperature,
            "humidity": humidity,
            "precipitation": precipitation,
            "windSpeed": wind_speed,
            "conditions": condition
        })
    
    return {"history": history_data}

# Chat endpoint
@app.post("/api/chat")
async def chat_with_ai(message: ChatMessage):
    try:
        # Mock AI response (in production, use Z-AI SDK)
        ai_response = {
            "response": f"I understand you're asking about: {message.message}. Based on the weather data, I can help you with weather predictions, risk assessments, and alert management.",
            "timestamp": datetime.now().isoformat(),
            "suggestions": [
                "Check weather predictions for your location",
                "Set up custom weather alerts",
                "Analyze weather patterns and risks"
            ]
        }
        return ai_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

# Data export endpoints
@app.get("/api/export/weather-data")
async def export_weather_data(format: str = Query("csv", regex="^(csv|json)$")):
    if format == "csv":
        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "city", "country", "latitude", "longitude", "date", "eventType",
            "temperature", "humidity", "windSpeed", "precipitation", "conditions", "riskLevel"
        ])
        
        # Write data
        for data in weather_data_store:
            writer.writerow([
                data["city"], data["country"], data["latitude"], data["longitude"],
                data["date"], data["eventType"], data["temperature"], data["humidity"],
                data["windSpeed"], data["precipitation"], data["conditions"], data["riskLevel"]
            ])
        
        output.seek(0)
        return StreamingResponse(
            io.StringIO(output.getvalue()),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=weather_data.csv"}
        )
    else:
        # Return JSON
        return JSONResponse(content={"weather_data": weather_data_store})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)