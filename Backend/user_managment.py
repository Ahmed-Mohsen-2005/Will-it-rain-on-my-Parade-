import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import pandas as pd
from pydantic import BaseModel, EmailStr, validator

# Pydantic models for user management
class UserPreferences(BaseModel):
    temperature_unit: str = "celsius"
    wind_speed_unit: str = "kmh"
    default_location: str = ""
    alert_notifications: bool = True
    risk_threshold: str = "medium"
    language: str = "en"
    timezone: str = "UTC"
    theme: str = "light"

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
    isDefault: bool = False
    created_at: str
    updated_at: str

class WeatherAlert(BaseModel):
    id: str
    user_id: str
    location: str
    latitude: float
    longitude: float
    alert_type: str
    threshold: float
    condition: str  # "above" or "below"
    is_active: bool = True
    created_at: str
    updated_at: str
    description: str
    notification_methods: List[str] = ["email"]
    last_triggered: Optional[str] = None

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    profile: UserPreferences
    locations: List[UserLocation] = []
    alerts: List[WeatherAlert] = []
    created_at: str
    updated_at: str
    last_login: Optional[str] = None
    is_active: bool = True

class UserCreateRequest(BaseModel):
    name: str
    email: EmailStr
    preferences: Optional[UserPreferences] = None

class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    preferences: Optional[UserPreferences] = None

class LocationCreateRequest(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    city: str
    state: str
    country: str
    countryCode: str
    isDefault: bool = False

class AlertCreateRequest(BaseModel):
    location: str
    latitude: float
    longitude: float
    alert_type: str
    threshold: float
    condition: str
    description: str
    notification_methods: List[str] = ["email"]

class AlertUpdateRequest(BaseModel):
    location: Optional[str] = None
    alert_type: Optional[str] = None
    threshold: Optional[float] = None
    condition: Optional[str] = None
    description: Optional[str] = None
    notification_methods: Optional[List[str]] = None
    is_active: Optional[bool] = None

class UserManagementService:
    def __init__(self):
        self.users_file = "users_enhanced.json"
        self.locations_file = "locations_enhanced.json"
        self.alerts_file = "alerts_enhanced.json"
        self.users: Dict[str, UserProfile] = {}
        self.locations: Dict[str, UserLocation] = {}
        self.alerts: Dict[str, WeatherAlert] = {}
        self.load_data()
    
    def load_data(self):
        """Load user data from files"""
        try:
            # Load users
            with open(self.users_file, 'r') as f:
                users_data = json.load(f)
                for user_data in users_data:
                    user = UserProfile(**user_data)
                    self.users[user.id] = user
        except FileNotFoundError:
            print(f"{self.users_file} not found, will create new file")
            self.create_default_user()
        
        try:
            # Load locations
            with open(self.locations_file, 'r') as f:
                locations_data = json.load(f)
                for loc_data in locations_data:
                    location = UserLocation(**loc_data)
                    self.locations[location.id] = location
        except FileNotFoundError:
            print(f"{self.locations_file} not found, will create new file")
        
        try:
            # Load alerts
            with open(self.alerts_file, 'r') as f:
                alerts_data = json.load(f)
                for alert_data in alerts_data:
                    alert = WeatherAlert(**alert_data)
                    self.alerts[alert.id] = alert
        except FileNotFoundError:
            print(f"{self.alerts_file} not found, will create new file")
    
    def save_data(self):
        """Save user data to files"""
        # Save users
        with open(self.users_file, 'w') as f:
            users_data = [user.dict() for user in self.users.values()]
            json.dump(users_data, f, indent=2)
        
        # Save locations
        with open(self.locations_file, 'w') as f:
            locations_data = [location.dict() for location in self.locations.values()]
            json.dump(locations_data, f, indent=2)
        
        # Save alerts
        with open(self.alerts_file, 'w') as f:
            alerts_data = [alert.dict() for alert in self.alerts.values()]
            json.dump(alerts_data, f, indent=2)
    
    def create_default_user(self):
        """Create a default demo user"""
        default_user = UserProfile(
            id="demo_user",
            name="Demo User",
            email="demo@example.com",
            profile=UserPreferences(),
            locations=[],
            alerts=[],
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            last_login=datetime.now().isoformat()
        )
        
        self.users[default_user.id] = default_user
        self.save_data()
    
    def create_user(self, request: UserCreateRequest) -> UserProfile:
        """Create a new user"""
        user_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        user = UserProfile(
            id=user_id,
            name=request.name,
            email=request.email,
            profile=request.preferences or UserPreferences(),
            locations=[],
            alerts=[],
            created_at=now,
            updated_at=now,
            last_login=now
        )
        
        self.users[user_id] = user
        self.save_data()
        
        return user
    
    def get_user(self, user_id: str) -> Optional[UserProfile]:
        """Get user by ID"""
        user = self.users.get(user_id)
        if user:
            # Update last login
            user.last_login = datetime.now().isoformat()
            self.save_data()
        return user
    
    def update_user(self, user_id: str, request: UserUpdateRequest) -> Optional[UserProfile]:
        """Update user profile"""
        user = self.users.get(user_id)
        if not user:
            return None
        
        # Update fields
        if request.name is not None:
            user.name = request.name
        if request.email is not None:
            user.email = request.email
        if request.preferences is not None:
            user.profile = request.preferences
        
        user.updated_at = datetime.now().isoformat()
        self.save_data()
        
        return user
    
    def delete_user(self, user_id: str) -> bool:
        """Delete user and associated data"""
        if user_id not in self.users:
            return False
        
        # Delete user
        del self.users[user_id]
        
        # Delete user's locations
        user_locations = [loc_id for loc_id, loc in self.locations.items() if loc_id.startswith(user_id)]
        for loc_id in user_locations:
            del self.locations[loc_id]
        
        # Delete user's alerts
        user_alerts = [alert_id for alert_id, alert in self.alerts.items() if alert.user_id == user_id]
        for alert_id in user_alerts:
            del self.alerts[alert_id]
        
        self.save_data()
        return True
    
    def add_location(self, user_id: str, request: LocationCreateRequest) -> Optional[UserLocation]:
        """Add a new location for user"""
        user = self.users.get(user_id)
        if not user:
            return None
        
        location_id = f"{user_id}_loc_{len(user.locations) + 1}"
        now = datetime.now().isoformat()
        
        # If this is set as default, remove default from other locations
        if request.isDefault:
            for loc in user.locations:
                loc.isDefault = False
        
        location = UserLocation(
            id=location_id,
            name=request.name,
            address=request.address,
            latitude=request.latitude,
            longitude=request.longitude,
            city=request.city,
            state=request.state,
            country=request.country,
            countryCode=request.countryCode,
            isDefault=request.isDefault,
            created_at=now,
            updated_at=now
        )
        
        user.locations.append(location)
        self.locations[location_id] = location
        user.updated_at = now
        self.save_data()
        
        return location
    
    def update_location(self, user_id: str, location_id: str, request: LocationCreateRequest) -> Optional[UserLocation]:
        """Update user location"""
        user = self.users.get(user_id)
        if not user:
            return None
        
        location = None
        for loc in user.locations:
            if loc.id == location_id:
                location = loc
                break
        
        if not location:
            return None
        
        # If this is set as default, remove default from other locations
        if request.isDefault and not location.isDefault:
            for loc in user.locations:
                loc.isDefault = False
        
        # Update location
        location.name = request.name
        location.address = request.address
        location.latitude = request.latitude
        location.longitude = request.longitude
        location.city = request.city
        location.state = request.state
        location.country = request.country
        location.countryCode = request.countryCode
        location.isDefault = request.isDefault
        location.updated_at = datetime.now().isoformat()
        
        user.updated_at = datetime.now().isoformat()
        self.save_data()
        
        return location
    
    def delete_location(self, user_id: str, location_id: str) -> bool:
        """Delete user location"""
        user = self.users.get(user_id)
        if not user:
            return False
        
        # Find and remove location
        for i, loc in enumerate(user.locations):
            if loc.id == location_id:
                user.locations.pop(i)
                if location_id in self.locations:
                    del self.locations[location_id]
                user.updated_at = datetime.now().isoformat()
                self.save_data()
                return True
        
        return False
    
    def create_alert(self, user_id: str, request: AlertCreateRequest) -> Optional[WeatherAlert]:
        """Create a new weather alert"""
        user = self.users.get(user_id)
        if not user:
            return None
        
        alert_id = f"{user_id}_alert_{len(user.alerts) + 1}"
        now = datetime.now().isoformat()
        
        alert = WeatherAlert(
            id=alert_id,
            user_id=user_id,
            location=request.location,
            latitude=request.latitude,
            longitude=request.longitude,
            alert_type=request.alert_type,
            threshold=request.threshold,
            condition=request.condition,
            is_active=True,
            created_at=now,
            updated_at=now,
            description=request.description,
            notification_methods=request.notification_methods
        )
        
        user.alerts.append(alert)
        self.alerts[alert_id] = alert
        user.updated_at = now
        self.save_data()
        
        return alert
    
    def update_alert(self, user_id: str, alert_id: str, request: AlertUpdateRequest) -> Optional[WeatherAlert]:
        """Update weather alert"""
        user = self.users.get(user_id)
        if not user:
            return None
        
        alert = None
        for a in user.alerts:
            if a.id == alert_id:
                alert = a
                break
        
        if not alert:
            return None
        
        # Update alert fields
        if request.location is not None:
            alert.location = request.location
        if request.alert_type is not None:
            alert.alert_type = request.alert_type
        if request.threshold is not None:
            alert.threshold = request.threshold
        if request.condition is not None:
            alert.condition = request.condition
        if request.description is not None:
            alert.description = request.description
        if request.notification_methods is not None:
            alert.notification_methods = request.notification_methods
        if request.is_active is not None:
            alert.is_active = request.is_active
        
        alert.updated_at = datetime.now().isoformat()
        user.updated_at = datetime.now().isoformat()
        self.save_data()
        
        return alert
    
    def delete_alert(self, user_id: str, alert_id: str) -> bool:
        """Delete weather alert"""
        user = self.users.get(user_id)
        if not user:
            return False
        
        # Find and remove alert
        for i, alert in enumerate(user.alerts):
            if alert.id == alert_id:
                user.alerts.pop(i)
                if alert_id in self.alerts:
                    del self.alerts[alert_id]
                user.updated_at = datetime.now().isoformat()
                self.save_data()
                return True
        
        return False
    
    def get_user_alerts(self, user_id: str) -> List[WeatherAlert]:
        """Get all alerts for a user"""
        user = self.users.get(user_id)
        if not user:
            return []
        
        return user.alerts
    
    def get_active_alerts(self, user_id: str) -> List[WeatherAlert]:
        """Get active alerts for a user"""
        user = self.users.get(user_id)
        if not user:
            return []
        
        return [alert for alert in user.alerts if alert.is_active]
    
    def check_alert_conditions(self, user_id: str, weather_data: Dict[str, Any]) -> List[WeatherAlert]:
        """Check which alerts are triggered by current weather data"""
        user = self.users.get(user_id)
        if not user:
            return []
        
        triggered_alerts = []
        
        for alert in user.alerts:
            if not alert.is_active:
                continue
            
            triggered = False
            
            # Check alert condition based on type
            if alert.alert_type == "temperature":
                temp = weather_data.get("temperature", 0)
                if alert.condition == "above" and temp > alert.threshold:
                    triggered = True
                elif alert.condition == "below" and temp < alert.threshold:
                    triggered = True
            
            elif alert.alert_type == "precipitation":
                precip = weather_data.get("precipitation", 0)
                if alert.condition == "above" and precip > alert.threshold:
                    triggered = True
                elif alert.condition == "below" and precip < alert.threshold:
                    triggered = True
            
            elif alert.alert_type == "wind":
                wind = weather_data.get("windSpeed", 0)
                if alert.condition == "above" and wind > alert.threshold:
                    triggered = True
                elif alert.condition == "below" and wind < alert.threshold:
                    triggered = True
            
            elif alert.alert_type == "humidity":
                humidity = weather_data.get("humidity", 0)
                if alert.condition == "above" and humidity > alert.threshold:
                    triggered = True
                elif alert.condition == "below" and humidity < alert.threshold:
                    triggered = True
            
            if triggered:
                triggered_alerts.append(alert)
                # Update last triggered time
                alert.last_triggered = datetime.now().isoformat()
        
        if triggered_alerts:
            user.updated_at = datetime.now().isoformat()
            self.save_data()
        
        return triggered_alerts
    
    def get_user_locations(self, user_id: str) -> List[UserLocation]:
        """Get all locations for a user"""
        user = self.users.get(user_id)
        if not user:
            return []
        
        return user.locations
    
    def get_default_location(self, user_id: str) -> Optional[UserLocation]:
        """Get default location for a user"""
        user = self.users.get(user_id)
        if not user:
            return None
        
        for location in user.locations:
            if location.isDefault:
                return location
        
        # If no default, return first location
        if user.locations:
            return user.locations[0]
        
        return None
    
    def get_user_preferences(self, user_id: str) -> Optional[UserPreferences]:
        """Get user preferences"""
        user = self.users.get(user_id)
        if not user:
            return None
        
        return user.profile
    
    def update_user_preferences(self, user_id: str, preferences: UserPreferences) -> Optional[UserPreferences]:
        """Update user preferences"""
        user = self.users.get(user_id)
        if not user:
            return None
        
        user.profile = preferences
        user.updated_at = datetime.now().isoformat()
        self.save_data()
        
        return preferences
    
    def get_user_stats(self, user_id: str) -> Dict[str, Any]:
        """Get user statistics"""
        user = self.users.get(user_id)
        if not user:
            return {}
        
        active_alerts = len([alert for alert in user.alerts if alert.is_active])
        total_locations = len(user.locations)
        
        return {
            "total_alerts": len(user.alerts),
            "active_alerts": active_alerts,
            "total_locations": total_locations,
            "member_since": user.created_at,
            "last_login": user.last_login,
            "account_active": user.is_active
        }
    
    def export_user_data(self, user_id: str) -> Dict[str, Any]:
        """Export all user data"""
        user = self.users.get(user_id)
        if not user:
            return {}
        
        return {
            "user_profile": user.dict(),
            "locations": [loc.dict() for loc in user.locations],
            "alerts": [alert.dict() for alert in user.alerts],
            "exported_at": datetime.now().isoformat()
        }
    
    def import_user_data(self, user_data: Dict[str, Any]) -> Optional[UserProfile]:
        """Import user data"""
        try:
            # Create user from imported data
            user_profile_data = user_data.get("user_profile", {})
            user = UserProfile(**user_profile_data)
            
            # Import locations
            locations_data = user_data.get("locations", [])
            for loc_data in locations_data:
                location = UserLocation(**loc_data)
                user.locations.append(location)
                self.locations[location.id] = location
            
            # Import alerts
            alerts_data = user_data.get("alerts", [])
            for alert_data in alerts_data:
                alert = WeatherAlert(**alert_data)
                user.alerts.append(alert)
                self.alerts[alert.id] = alert
            
            # Save user
            self.users[user.id] = user
            self.save_data()
            
            return user
            
        except Exception as e:
            print(f"Error importing user data: {e}")
            return None

# Global service instance
user_service = UserManagementService()