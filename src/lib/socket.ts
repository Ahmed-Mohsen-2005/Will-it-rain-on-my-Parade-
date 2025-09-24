import { Server } from 'socket.io';

interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'extreme';
  location: string;
  timestamp: string;
}

interface UserSubscription {
  userId: string;
  locations: string[];
  alertThreshold: number;
}

export const setupSocket = (io: Server) => {
  const userSubscriptions = new Map<string, UserSubscription>();
  
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Handle user subscription to weather alerts
    socket.on('subscribe-weather', (subscription: UserSubscription) => {
      console.log('User subscribed to weather alerts:', subscription);
      userSubscriptions.set(socket.id, subscription);
      
      // Send confirmation
      socket.emit('subscription-confirmed', {
        message: 'Successfully subscribed to weather alerts',
        subscription
      });
    });

    // Handle weather alert requests
    socket.on('request-weather-alert', (data: { location: string; threshold: number }) => {
      console.log('Weather alert requested for:', data);
      
      // Simulate weather alert generation
      const alert: WeatherAlert = {
        id: Math.random().toString(36).substr(2, 9),
        title: 'Weather Alert',
        description: `Weather conditions detected for ${data.location}`,
        severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
        location: data.location,
        timestamp: new Date().toISOString()
      };
      
      // Send the alert
      socket.emit('weather-alert', alert);
    });

    // Handle real-time weather monitoring
    socket.on('monitor-weather', (data: { location: string; interval: number }) => {
      console.log('Weather monitoring started for:', data);
      
      const interval = setInterval(() => {
        // Simulate weather data generation
        const weatherData = {
          location: data.location,
          temperature: Math.floor(Math.random() * 30) + 10,
          precipitation: Math.floor(Math.random() * 100),
          windSpeed: Math.floor(Math.random() * 20) + 5,
          humidity: Math.floor(Math.random() * 60) + 40,
          timestamp: new Date().toISOString()
        };
        
        // Check if conditions meet alert threshold
        const subscription = userSubscriptions.get(socket.id);
        if (subscription && weatherData.precipitation >= subscription.alertThreshold) {
          const alert: WeatherAlert = {
            id: Math.random().toString(36).substr(2, 9),
            title: 'Precipitation Alert',
            description: `Precipitation levels (${weatherData.precipitation}%) exceed your threshold (${subscription.alertThreshold}%)`,
            severity: weatherData.precipitation > 80 ? 'extreme' : weatherData.precipitation > 60 ? 'high' : 'medium',
            location: data.location,
            timestamp: new Date().toISOString()
          };
          
          socket.emit('weather-alert', alert);
        }
        
        // Send regular weather updates
        socket.emit('weather-update', weatherData);
        
      }, data.interval || 30000); // Default 30 seconds
      
      // Clean up on disconnect
      socket.on('disconnect', () => {
        clearInterval(interval);
        userSubscriptions.delete(socket.id);
        console.log('Client disconnected:', socket.id);
      });
    });

    // Handle manual alert testing
    socket.on('test-alert', (data: { severity: 'low' | 'medium' | 'high' | 'extreme' }) => {
      const testAlert: WeatherAlert = {
        id: Math.random().toString(36).substr(2, 9),
        title: 'Test Weather Alert',
        description: `This is a test ${data.severity} severity alert`,
        severity: data.severity,
        location: 'Test Location',
        timestamp: new Date().toISOString()
      };
      
      socket.emit('weather-alert', testAlert);
    });

    // Handle legacy messages for backward compatibility
    socket.on('message', (msg: { text: string; senderId: string }) => {
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to NASA Weather Alert System!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });
    
    // Send system info
    socket.emit('system-info', {
      features: [
        'Real-time weather monitoring',
        'Customizable alert thresholds',
        'Location-based alerts',
        'Severity-based notifications',
        'Weather data visualization'
      ],
      instructions: 'Subscribe to weather alerts using "subscribe-weather" event'
    });
  });
};