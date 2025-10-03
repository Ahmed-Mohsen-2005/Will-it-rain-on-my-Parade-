import pandas as pd
import json
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Event types for different activities
EVENT_TYPES = ["wedding", "outdoor", "concert", "parade", "sports"]

# Weather conditions mapping
WEATHER_CONDITIONS = [
    "Sunny", "Cloudy", "Rainy", "Stormy", "Partly Cloudy", 
    "Overcast", "Light Rain", "Snow", "Clear", "Drizzle"
]

def generate_recommendations(weather_condition: str, risk_level: str, event_type: str) -> Dict[str, str]:
    """Generate recommendations based on weather conditions and event type"""
    
    # Weather advisory based on conditions
    condition_advisories = {
        "Sunny": "Perfect weather for outdoor activities. Consider sun protection.",
        "Cloudy": "Good conditions for most outdoor events. Light jacket recommended.",
        "Rainy": "Indoor activities recommended. Have backup plans ready.",
        "Stormy": "High risk - postpone outdoor activities. Seek shelter immediately.",
        "Light Rain": "Light rain expected. Waterproof clothing recommended.",
        "Overcast": "Overcast skies - good for photography, mild conditions.",
        "Snow": "Winter weather conditions. Dress warmly and be cautious of travel.",
        "Clear": "Clear skies - excellent visibility for all activities.",
        "Drizzle": "Light drizzle expected - minimal impact on activities."
    }
    
    # Event-specific timing recommendations
    event_timing = {
        "wedding": "Late morning or early afternoon recommended for best lighting.",
        "outdoor": "Mid-day activities preferred for optimal conditions.",
        "concert": "Evening events suitable, consider temperature drops.",
        "parade": "Morning parades recommended to avoid afternoon heat/storms.",
        "sports": "Early morning or late afternoon to avoid extreme temperatures."
    }
    
    # Risk-based backup plans
    backup_plans = {
        "Low": "No backup plans needed. Proceed as planned.",
        "Medium": "Have indoor alternatives available if conditions worsen.",
        "High": "Prepare indoor venue options and flexible scheduling.",
        "Critical": "Comprehensive backup plans essential, consider cancellation."
    }
    
    # Event-specific backup recommendations
    event_backup = {
        "wedding": "Indoor venue option, tent rental, rain date contingency",
        "outdoor": "Indoor facility access, weather monitoring system",
        "concert": "Indoor stage backup, equipment protection plans",
        "parade": "Alternative route planning, emergency shelter access",
        "sports": "Indoor training facility, schedule flexibility"
    }
    
    return {
        "weatherAdvisory": condition_advisories.get(weather_condition, "Monitor weather conditions."),
        "optimalTiming": event_timing.get(event_type, "Check weather updates regularly."),
        "backupPlans": f"{backup_plans.get(risk_level, 'Have contingency plans ready.')}. {event_backup.get(event_type, '')}"
    }

def generate_risk_analysis(row: pd.Series) -> Dict[str, Dict[str, str]]:
    """Generate detailed risk analysis based on weather data"""
    
    temp = row['temperature']
    precip = row['precipitation']
    wind = row['windSpeed']
    
    # Precipitation risk assessment
    if precip > 80:
        precip_level = "Extreme"
        precip_desc = "Very heavy precipitation expected, severe impact on all outdoor activities"
    elif precip > 60:
        precip_level = "High"
        precip_desc = "Heavy precipitation likely, significant impact on activities"
    elif precip > 30:
        precip_level = "Medium"
        precip_desc = "Moderate precipitation expected, some impact on activities"
    else:
        precip_level = "Low"
        precip_desc = "Minimal precipitation expected, low impact on activities"
    
    # Wind impact assessment
    if wind > 40:
        wind_level = "Extreme"
        wind_desc = "Dangerous winds expected, high risk of damage and safety hazards"
    elif wind > 25:
        wind_level = "High"
        wind_desc = "Strong winds expected, high impact on outdoor activities"
    elif wind > 15:
        wind_level = "Medium"
        wind_desc = "Moderate winds, some impact on activities and equipment"
    else:
        wind_level = "Low"
        wind_desc = "Light winds, minimal impact on activities"
    
    # Temperature comfort assessment
    if temp > 35:
        temp_level = "Extreme"
        temp_desc = "Extreme heat - high risk of heat exhaustion and dehydration"
    elif temp < -10:
        temp_level = "Extreme"
        temp_desc = "Extreme cold - high risk of hypothermia and frostbite"
    elif temp > 30:
        temp_level = "High"
        temp_desc = "Very hot conditions, heat stress risk for prolonged exposure"
    elif temp < 0:
        temp_level = "High"
        temp_desc = "Freezing conditions, risk of hypothermia and ice hazards"
    elif 18 <= temp <= 25:
        temp_level = "Low"
        temp_desc = "Comfortable temperature range for most activities"
    else:
        temp_level = "Medium"
        temp_desc = "Moderate temperature, some discomfort possible for extended periods"
    
    return {
        "precipitationRisk": {
            "level": precip_level,
            "description": precip_desc
        },
        "windImpact": {
            "level": wind_level,
            "description": wind_desc
        },
        "temperatureComfort": {
            "level": temp_level,
            "description": temp_desc
        }
    }

def generate_hourly_forecast(date_str: str, base_temp: float) -> List[Dict[str, Any]]:
    """Generate hourly forecast data"""
    
    hourly_data = []
    base_date = datetime.strptime(date_str, "%Y-%m-%d")
    
    # Conditions that can occur throughout the day
    conditions = ["Clear", "Cloudy", "Partly Cloudy", "Light Rain", "Overcast", "Drizzle"]
    
    for hour in range(0, 24, 3):  # Every 3 hours
        time_str = f"{hour:02d}:00"
        
        # Temperature variation throughout the day
        # Cooler in early morning, warmer in afternoon
        if 6 <= hour <= 18:
            temp_variation = random.uniform(-2, 5)  # Warmer during day
        else:
            temp_variation = random.uniform(-8, -1)  # Cooler at night
        
        temperature = base_temp + temp_variation
        precipitation = max(0, min(100, random.uniform(-20, 30)))  # Keep within 0-100
        
        # Weather condition progression
        if hour < 6:
            condition = random.choice(["Clear", "Cloudy"])
        elif hour < 12:
            condition = random.choice(["Clear", "Partly Cloudy", "Cloudy"])
        elif hour < 18:
            condition = random.choice(["Partly Cloudy", "Cloudy", "Light Rain"])
        else:
            condition = random.choice(["Cloudy", "Overcast", "Light Rain"])
        
        hourly_data.append({
            "time": time_str,
            "temperature": round(temperature, 1),
            "precipitation": round(precipitation, 1),
            "conditions": condition
        })
    
    return hourly_data

def generate_address_data(city: str, country: str = "USA") -> Dict[str, str]:
    """Generate address data for cities"""
    
    # City to state mapping for US cities
    city_to_state = {
        "New York": "NY",
        "Los Angeles": "CA", 
        "Chicago": "IL",
        "Houston": "TX",
        "Phoenix": "AZ",
        "Philadelphia": "PA",
        "San Antonio": "TX",
        "San Diego": "CA",
        "Dallas": "TX",
        "San Jose": "CA",
        "Austin": "TX",
        "Jacksonville": "FL",
        "Fort Worth": "TX",
        "Columbus": "OH",
        "Charlotte": "NC",
        "San Francisco": "CA",
        "Indianapolis": "IN",
        "Seattle": "WA",
        "Denver": "CO"
    }
    
    # International cities
    international_cities = {
        "London": {"country": "UK", "countryCode": "GB"},
        "Paris": {"country": "France", "countryCode": "FR"},
        "Tokyo": {"country": "Japan", "countryCode": "JP"},
        "Sydney": {"country": "Australia", "countryCode": "AU"},
        "Toronto": {"country": "Canada", "countryCode": "CA"},
        "Berlin": {"country": "Germany", "countryCode": "DE"},
        "Rome": {"country": "Italy", "countryCode": "IT"},
        "Madrid": {"country": "Spain", "countryCode": "ES"},
        "Amsterdam": {"country": "Netherlands", "countryCode": "NL"},
        "Vienna": {"country": "Austria", "countryCode": "AT"}
    }
    
    if city in international_cities:
        info = international_cities[city]
        return {
            "city": city,
            "state": "",
            "country": info["country"],
            "countryCode": info["countryCode"]
        }
    else:
        return {
            "city": city,
            "state": city_to_state.get(city, ""),
            "country": country,
            "countryCode": "US"
        }

def enhance_weather_data(input_file: str, output_file: str):
    """Enhance existing weather data with missing columns"""
    
    print(f"Loading data from {input_file}...")
    df = pd.read_csv(input_file)
    
    print(f"Original data shape: {df.shape}")
    print(f"Original columns: {list(df.columns)}")
    
    enhanced_data = []
    
    for index, row in df.iterrows():
        if index % 100 == 0:
            print(f"Processing row {index}/{len(df)}...")
        
        # Generate event type
        event_type = random.choice(EVENT_TYPES)
        
        # Generate recommendations
        recommendations = generate_recommendations(
            row['conditions'], 
            row['riskLevel'], 
            event_type
        )
        
        # Generate risk analysis
        risk_analysis = generate_risk_analysis(row)
        
        # Generate hourly forecast
        hourly_forecast = generate_hourly_forecast(row['date'], row['temperature'])
        
        # Generate address data
        address = generate_address_data(row['city'], row.get('country', 'USA'))
        
        # Create enhanced record
        enhanced_record = {
            # Original columns
            "city": row['city'],
            "country": row.get('country', 'USA'),
            "latitude": row['latitude'],
            "longitude": row['longitude'],
            "date": row['date'],
            "temperature": row['temperature'],
            "humidity": row['humidity'],
            "windSpeed": row['windSpeed'],
            "precipitation": row['precipitation'],
            "conditions": row['conditions'],
            "riskLevel": row['riskLevel'],
            
            # New columns
            "eventType": event_type,
            "address": address,
            "recommendations": recommendations,
            "riskAnalysis": risk_analysis,
            "hourlyForecast": hourly_forecast,
            
            # Additional original columns if they exist
            "feels_like_celsius": row.get('feels_like_celsius', row['temperature']),
            "pressure_hpa": row.get('pressure_hpa', 1013.25),
            "visibility_km": row.get('visibility_km', 10.0),
            "uv_index": row.get('uv_index', 5.0),
            "wind_direction": row.get('wind_direction', 'N')
        }
        
        enhanced_data.append(enhanced_record)
    
    print(f"Enhanced {len(enhanced_data)} records")
    
    # Save enhanced data
    print(f"Saving enhanced data to {output_file}...")
    with open(output_file, 'w') as f:
        json.dump(enhanced_data, f, indent=2)
    
    print("Data enhancement completed!")
    
    return enhanced_data

def create_enhanced_csv(input_file: str, output_file: str):
    """Create enhanced CSV file with new columns"""
    
    print(f"Loading data from {input_file}...")
    df = pd.read_csv(input_file)
    
    print(f"Original data shape: {df.shape}")
    
    # Add new columns
    enhanced_rows = []
    
    for index, row in df.iterrows():
        if index % 100 == 0:
            print(f"Processing row {index}/{len(df)}...")
        
        # Generate new data
        event_type = random.choice(EVENT_TYPES)
        recommendations = generate_recommendations(
            row['conditions'], 
            row['riskLevel'], 
            event_type
        )
        risk_analysis = generate_risk_analysis(row)
        hourly_forecast = generate_hourly_forecast(row['date'], row['temperature'])
        address = generate_address_data(row['city'], row.get('country', 'USA'))
        
        # Create enhanced row
        enhanced_row = row.copy()
        enhanced_row['eventType'] = event_type
        enhanced_row['address_json'] = json.dumps(address)
        enhanced_row['recommendations_json'] = json.dumps(recommendations)
        enhanced_row['riskAnalysis_json'] = json.dumps(risk_analysis)
        enhanced_row['hourlyForecast_json'] = json.dumps(hourly_forecast)
        enhanced_row['city'] = row['city']  # Ensure consistency
        
        enhanced_rows.append(enhanced_row)
    
    # Create new DataFrame
    enhanced_df = pd.DataFrame(enhanced_rows)
    
    # Save to CSV
    print(f"Saving enhanced CSV to {output_file}...")
    enhanced_df.to_csv(output_file, index=False)
    
    print("CSV enhancement completed!")
    
    return enhanced_df

if __name__ == "__main__":
    # Enhance the existing weather data
    input_csv = "weather_data.csv"
    output_json = "weather_data_enhanced.json"
    output_csv = "weather_data_enhanced.csv"
    
    # Create enhanced JSON file
    enhanced_data = enhance_weather_data(input_csv, output_json)
    
    # Create enhanced CSV file
    enhanced_df = create_enhanced_csv(input_csv, output_csv)
    
    print(f"\nEnhancement complete!")
    print(f"- Enhanced JSON: {output_json}")
    print(f"- Enhanced CSV: {output_csv}")
    print(f"- Total records processed: {len(enhanced_data)}")
    
    # Show sample of enhanced data
    print(f"\nSample enhanced record:")
    sample = enhanced_data[0]
    for key, value in sample.items():
        if key in ['recommendations', 'riskAnalysis', 'address']:
            print(f"  {key}: {json.dumps(value, indent=4)}")
        elif key == 'hourlyForecast':
            print(f"  {key}: {len(value)} hourly entries")
        else:
            print(f"  {key}: {value}")