'use client'
import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { CalendarIcon, MapPinIcon, CloudIcon, DropletsIcon, WindIcon, ThermometerIcon, AlertTriangleIcon, UserIcon, SettingsIcon, BellIcon, PlusIcon, Square, Navigation, MessageCircle, Send, X, Bot } from 'lucide-react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { LoadScript, GoogleMap, Marker, Polygon } from '@react-google-maps/api'

// Google Maps configuration
const mapContainerStyle = {
  width: '100%',
  height: '400px'
}

const defaultCenter = {
  lat: 20,
  lng: 0
}

// Chatbot Component
const Chatbot = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean; timestamp: Date }>>([
    {
      text: "Hello! I'm your weather assistant. I can help you understand weather forecasts, suggest event planning strategies, and explain weather patterns. How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on current weather patterns, I'd recommend checking the precipitation probability for your event timing.",
        "For outdoor events, consider having a backup plan if precipitation exceeds 40%.",
        "The temperature trends suggest comfortable conditions, but watch for sudden changes in wind speed.",
        "I can help you analyze satellite imagery to understand cloud coverage in your area.",
        "Looking at historical data, this location typically experiences similar conditions during this season."
      ]
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      
      const botMessage = {
        text: randomResponse,
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMessage])
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-slate-800 border border-blue-700 rounded-lg shadow-2xl z-50 flex flex-col">
      {/* Chat Header */}
      <div className="bg-blue-900/50 p-4 rounded-t-lg border-b border-blue-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Weather Assistant</h3>
            <p className="text-xs text-blue-300">Online • Ready to help</p>
          </div>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.isUser
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-700 text-slate-300 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p className="text-xs mt-1 opacity-70">
                {format(message.timestamp, 'HH:mm')}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about weather conditions..."
            className="flex-1 bg-slate-700 border-slate-600 text-white"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Ask about forecasts, event planning, or weather patterns
        </p>
      </div>
    </div>
  )
}

export default function Home() {
  const [location, setLocation] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [selectedLocation, setSelectedLocation] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [weatherData, setWeatherData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [riskLevel, setRiskLevel] = useState('')
  
  // User profile state
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userLocations, setUserLocations] = useState<any[]>([])
  const [userAlerts, setUserAlerts] = useState<any[]>([])
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)
  
  // Advanced features state
  const [aiPrediction, setAiPrediction] = useState<any>(null)
  const [satelliteImagery, setSatelliteImagery] = useState<any>(null)
  const [weatherPatterns, setWeatherPatterns] = useState<any>(null)
  const [isAdvancedLoading, setIsAdvancedLoading] = useState(false)
  
  // Real-time notifications state
  const [notifications, setNotifications] = useState<any[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [socket, setSocket] = useState<any>(null)

  // Map state
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [mapZoom, setMapZoom] = useState(2)
  const [map, setMap] = useState<any>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawnRegion, setDrawnRegion] = useState<any[]>([])
  const [mapMode, setMapMode] = useState<'select' | 'draw'>('select')

  // Chatbot state
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)

  const debounce = (func: (...args: any[]) => void, wait: number) => {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  // Update map when location is selected
  useEffect(() => {
    if (selectedLocation) {
      setMapCenter({
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude
      })
      setMapZoom(10)
    }
  }, [selectedLocation])

  const handleMapLoad = (mapInstance: any) => {
    setMap(mapInstance)
  }

  const handleMapClick = (e: any) => {
    if (mapMode === 'draw' && isDrawing) {
      const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() }
      setDrawnRegion(prev => [...prev, newPoint])
    } else if (mapMode === 'select') {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      
      // Create a mock location object for the clicked point
      const locationData = {
        id: `map-${lat}-${lng}`,
        name: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        latitude: lat,
        longitude: lng,
        address: {
          city: '',
          state: '',
          country: '',
          countryCode: ''
        }
      }
      setSelectedLocation(locationData)
      setLocation(locationData.name)
      setDrawnRegion([]) // Clear drawn region when selecting a point
    }
  }

  const toggleDrawingMode = () => {
    if (mapMode === 'select') {
      setMapMode('draw')
      setIsDrawing(true)
      setDrawnRegion([])
    } else {
      setMapMode('select')
      setIsDrawing(false)
      if (drawnRegion.length >= 3) {
        // Create region location
        const center = calculateRegionCenter(drawnRegion)
        const locationData = {
          id: `region-${Date.now()}`,
          name: `Custom Region (${drawnRegion.length} points)`,
          latitude: center.lat,
          longitude: center.lng,
          address: {
            city: 'Custom Region',
            state: '',
            country: '',
            countryCode: ''
          },
          region: drawnRegion
        }
        setSelectedLocation(locationData)
        setLocation(locationData.name)
      }
    }
  }

  const calculateRegionCenter = (points: any[]) => {
    const lat = points.reduce((sum, point) => sum + point.lat, 0) / points.length
    const lng = points.reduce((sum, point) => sum + point.lng, 0) / points.length
    return { lat, lng }
  }

  const clearDrawnRegion = () => {
    setDrawnRegion([])
    setIsDrawing(false)
    setMapMode('select')
  }

  const handleLocationSearch = async (query: string) => {
    if (!query.trim()) {
      setLocationSuggestions([])
      return
    }
    
    setIsSearchingLocation(true)
    try {
      // Using OpenStreetMap Nominatim as fallback
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      )
      const data = await response.json()
      
      if (data && data.length > 0) {
        const locations = data.map((item: any) => ({
          id: item.place_id,
          name: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          address: {
            city: item.address?.city || item.address?.town || item.address?.village || '',
            state: item.address?.state || '',
            country: item.address?.country || '',
            countryCode: item.address?.country_code || ''
          }
        }))
        setLocationSuggestions(locations)
      } else {
        setLocationSuggestions([])
      }
    } catch (error) {
      console.error('Location search error:', error)
      // Fallback to mock data
      setLocationSuggestions([
        {
          id: '1',
          name: 'New York, NY, USA',
          latitude: 40.7128,
          longitude: -74.0060,
          address: { city: 'New York', state: 'NY', country: 'USA', countryCode: 'US' }
        },
        {
          id: '2',
          name: 'London, UK',
          latitude: 51.5074,
          longitude: -0.1278,
          address: { city: 'London', state: '', country: 'UK', countryCode: 'GB' }
        }
      ])
    } finally {
      setIsSearchingLocation(false)
    }
  }

  const debouncedLocationSearch = useCallback(debounce(handleLocationSearch, 300), [])

  useEffect(() => {
    if (location) {
      debouncedLocationSearch(location)
    } else {
      setLocationSuggestions([])
    }
  }, [location, debouncedLocationSearch])

  const handleLocationSelect = (location: any) => {
    console.log('Location selected:', location)
    setSelectedLocation(location)
    setLocation(location.name)
    setLocationSuggestions([])
    
    // Move map to selected location
    setMapCenter({
      lat: location.latitude,
      lng: location.longitude
    })
    setMapZoom(12)
    setDrawnRegion([]) // Clear any drawn region
    setMapMode('select') // Reset to select mode
  }

  const handleSearch = async () => {
    console.log('handleSearch called', { selectedLocation, selectedDate })
    if (!selectedLocation || !selectedDate) {
      console.log('Missing required fields:', { selectedLocation: !!selectedLocation, selectedDate: !!selectedDate })
      return
    }
    
    setIsLoading(true)
    setIsAdvancedLoading(true)
    try {
      console.log('Making API request to /api/weather')
      // Fetch basic weather data
      const weatherResponse = await fetch('/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          date: selectedDate.toISOString(),
          ...(selectedLocation.region && { region: selectedLocation.region })
        }),
      })
      
      console.log('Weather response status:', weatherResponse.status)
      const weatherData = await weatherResponse.json()
      console.log('Weather data received:', weatherData)
      setWeatherData(weatherData)
      setRiskLevel(weatherData.riskLevel)

      // Fetch advanced features in parallel
      const [aiResponse, satelliteResponse, patternsResponse] = await Promise.allSettled([
        fetch('/api/weather/ai-prediction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            date: selectedDate.toISOString(),
            eventType: 'outdoor',
            currentConditions: {
              temperature: weatherData.temperature,
              humidity: weatherData.humidity,
              windSpeed: weatherData.windSpeed,
              precipitation: weatherData.precipitation,
              conditions: weatherData.conditions
            },
            ...(selectedLocation.region && { region: selectedLocation.region })
          })
        }),
        fetch('/api/satellite/imagery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            date: selectedDate.toISOString(),
            imageryType: 'composite',
            resolution: 'high',
            ...(selectedLocation.region && { region: selectedLocation.region })
          })
        }),
        fetch('/api/weather/patterns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            date: selectedDate.toISOString(),
            patternType: 'comprehensive',
            ...(selectedLocation.region && { region: selectedLocation.region })
          })
        })
      ])

      if (aiResponse.status === 'fulfilled' && aiResponse.value.ok) {
        const aiData = await aiResponse.value.json()
        setAiPrediction(aiData)
      }

      if (satelliteResponse.status === 'fulfilled' && satelliteResponse.value.ok) {
        const satelliteData = await satelliteResponse.value.json()
        setSatelliteImagery(satelliteData)
      }

      if (patternsResponse.status === 'fulfilled' && patternsResponse.value.ok) {
        const patternsData = await patternsResponse.value.json()
        setWeatherPatterns(patternsData)
      }

    } catch (error) {
      console.error('Error fetching weather data:', error)
    } finally {
      setIsLoading(false)
      setIsAdvancedLoading(false)
    }
  }

  // User profile functions
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()
      setUserProfile(data)
      setUserLocations(data.locations || [])
      setUserAlerts(data.alerts || [])
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const updateUserProfile = async (profileData: any) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })
      const data = await response.json()
      setUserProfile(data)
    } catch (error) {
      console.error('Error updating user profile:', error)
    }
  }

  const saveLocation = async () => {
    if (!selectedLocation) return
    
    try {
      const response = await fetch('/api/user/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: selectedLocation.name,
          address: selectedLocation.name,
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          city: selectedLocation.address.city,
          state: selectedLocation.address.state,
          country: selectedLocation.address.country,
          countryCode: selectedLocation.address.countryCode,
          isDefault: userLocations.length === 0,
          ...(selectedLocation.region && { region: selectedLocation.region })
        }),
      })
      
      const newLocation = await response.json()
      setUserLocations([...userLocations, newLocation])
    } catch (error) {
      console.error('Error saving location:', error)
    }
  }

  const createWeatherAlert = async (alertData: any) => {
    try {
      const response = await fetch('/api/user/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      })
      
      const newAlert = await response.json()
      setUserAlerts([...userAlerts, newAlert])
      setIsAlertDialogOpen(false)
    } catch (error) {
      console.error('Error creating weather alert:', error)
    }
  }

  // Load user profile on component mount
  useEffect(() => {
    fetchUserProfile()
  }, [])

  // Initialize socket connection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('socket.io-client').then((ioModule) => {
        const io = ioModule.default
        const socketConnection = io('http://localhost:3000')
        setSocket(socketConnection)

        socketConnection.on('connect', () => {
          console.log('Connected to weather alert system')
        })

        socketConnection.on('weather-alert', (alert: any) => {
          setNotifications(prev => [{
            id: alert.id,
            type: 'weather-alert',
            title: alert.title,
            description: alert.description,
            severity: alert.severity,
            location: alert.location,
            timestamp: alert.timestamp,
            read: false
          }, ...prev])
        })

        socketConnection.on('weather-update', (data: any) => {
          console.log('Weather update received:', data)
        })

        socketConnection.on('subscription-confirmed', (data: any) => {
          console.log('Subscription confirmed:', data)
        })

        return () => {
          socketConnection.disconnect()
        }
      })
    }
  }, [])

  const startWeatherMonitoring = () => {
    if (socket && selectedLocation) {
      socket.emit('subscribe-weather', {
        userId: 'demo-user',
        locations: [selectedLocation.name],
        alertThreshold: userProfile?.profile?.alertThreshold || 50
      })

      socket.emit('monitor-weather', {
        location: selectedLocation.name,
        interval: 15000 // 15 seconds for demo
      })

      setIsMonitoring(true)
    }
  }

  const stopWeatherMonitoring = () => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
      setIsMonitoring(false)
    }
  }

  const testWeatherAlert = (severity: 'low' | 'medium' | 'high' | 'extreme') => {
    if (socket) {
      socket.emit('test-alert', { severity })
    }
  }

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'bg-red-500'
      case 'Medium': return 'bg-yellow-500'
      case 'Low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Floating Chatbot Button */}
      <Button
        onClick={() => setIsChatbotOpen(!isChatbotOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-2xl z-40"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Chatbot Component */}
      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

      {/* Header */}
      <header className="border-b border-blue-700 bg-blue-900/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <img src="/nasa2.png" alt="Logo" className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Will It Rain On My Parade?</h1>
                <p className="text-blue-300 text-sm">2025 NASA Space Apps Challenge</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-blue-500 text-blue-300 hover:bg-blue-600">
                    <UserIcon className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-blue-700 text-white max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5" />
                      User Profile
                    </DialogTitle>
                    <DialogDescription className="text-slate-300">
                      Manage your profile, locations, and weather alerts
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Profile Settings */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Settings</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="units">Units</Label>
                          <Select defaultValue="metric">
                            <SelectTrigger className="w-32 bg-slate-700 border-slate-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="metric">Metric</SelectItem>
                              <SelectItem value="imperial">Imperial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="theme">Theme</Label>
                          <Select defaultValue="auto">
                            <SelectTrigger className="w-32 bg-slate-700 border-slate-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                              <SelectItem value="auto">Auto</SelectItem>
                              <SelectItem value="light">Light</SelectItem>
                              <SelectItem value="dark">Dark</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="notifications">Email Notifications</Label>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    {/* Saved Locations */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Saved Locations</h3>
                        <Badge variant="outline" className="border-blue-500 text-blue-300">
                          {userLocations.length}
                        </Badge>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {userLocations.length > 0 ? (
                          userLocations.map((loc) => (
                            <div key={loc.id} className="p-2 bg-slate-700 rounded flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4 text-blue-400" />
                                <span className="text-sm">{loc.name}</span>
                                {loc.isDefault && (
                                  <Badge variant="outline" className="border-green-500 text-green-300 text-xs">
                                    Default
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400 text-center py-4">
                            No saved locations yet
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Weather Alerts */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Weather Alerts</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-blue-500 text-blue-300">
                            {userAlerts.length}
                          </Badge>
                          <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                <PlusIcon className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-800 border-blue-700 text-white">
                              <DialogHeader>
                                <DialogTitle>Create Weather Alert</DialogTitle>
                                <DialogDescription className="text-slate-300">
                                  Set up custom weather alerts for your locations
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="alert-title">Alert Title</Label>
                                  <Input id="alert-title" placeholder="e.g., Heavy Rain Warning" className="bg-slate-700 border-slate-600" />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="alert-severity">Severity</Label>
                                  <Select>
                                    <SelectTrigger className="bg-slate-700 border-slate-600">
                                      <SelectValue placeholder="Select severity" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700">
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="medium">Medium</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                      <SelectItem value="extreme">Extreme</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="min-precipitation">Min Precipitation (%)</Label>
                                  <Input id="min-precipitation" type="number" placeholder="50" className="bg-slate-700 border-slate-600" />
                                </div>
                                <Button 
                                  onClick={() => createWeatherAlert({})} 
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                  Create Alert
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {userAlerts.length > 0 ? (
                          userAlerts.map((alert) => (
                            <div key={alert.id} className="p-2 bg-slate-700 rounded flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <BellIcon className="w-4 h-4 text-yellow-400" />
                                <div>
                                  <div className="text-sm font-medium">{alert.title}</div>
                                  <div className="text-xs text-slate-400">{alert.severity}</div>
                                </div>
                              </div>
                              <Badge variant="outline" className={`${
                                alert.severity === 'extreme' ? 'border-red-500 text-red-300' :
                                alert.severity === 'high' ? 'border-orange-500 text-orange-300' :
                                alert.severity === 'medium' ? 'border-yellow-500 text-yellow-300' :
                                'border-green-500 text-green-300'
                              }`}>
                                {alert.severity}
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400 text-center py-4">
                            No weather alerts set up
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Real-time Monitoring */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Real-time Monitoring</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Status</span>
                          <Badge variant={isMonitoring ? "default" : "outline"} className={
                            isMonitoring ? "bg-green-600" : "border-slate-500 text-slate-300"
                          }>
                            {isMonitoring ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {selectedLocation && (
                          <div className="space-y-2">
                            {!isMonitoring ? (
                              <Button 
                                onClick={startWeatherMonitoring}
                                className="w-full bg-green-600 hover:bg-green-700"
                              >
                                Start Monitoring
                              </Button>
                            ) : (
                              <Button 
                                onClick={stopWeatherMonitoring}
                                variant="outline"
                                className="w-full border-red-500 text-red-300 hover:bg-red-600"
                              >
                                Stop Monitoring
                              </Button>
                            )}
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Test Alerts</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button 
                              onClick={() => testWeatherAlert('low')}
                              size="sm"
                              variant="outline"
                              className="border-green-500 text-green-300"
                            >
                              Low
                            </Button>
                            <Button 
                              onClick={() => testWeatherAlert('medium')}
                              size="sm"
                              variant="outline"
                              className="border-yellow-500 text-yellow-300"
                            >
                              Medium
                            </Button>
                            <Button 
                              onClick={() => testWeatherAlert('high')}
                              size="sm"
                              variant="outline"
                              className="border-orange-500 text-orange-300"
                            >
                              High
                            </Button>
                            <Button 
                              onClick={() => testWeatherAlert('extreme')}
                              size="sm"
                              variant="outline"
                              className="border-red-500 text-red-300"
                            >
                              Extreme
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Notifications */}
              <div className="relative">
                <Link href="/alerts">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-500 text-blue-300 hover:bg-blue-600 relative"
                  >
                    <BellIcon className="w-4 h-4 mr-2" />
                    Alerts
                    {notifications.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center p-0">
                        {notifications.filter(n => !n.read).length}
                      </Badge>
                    )}
                  </Button>
                </Link>
                
                {notifications.length > 0 && (
                  <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-blue-700 rounded-lg shadow-lg z-50">
                    <div className="p-3 border-b border-blue-700 flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Weather Alerts</h4>
                      <Button 
                        onClick={clearNotifications}
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-white"
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`p-3 border-b border-slate-700 hover:bg-slate-700 cursor-pointer ${
                            !notification.read ? 'bg-blue-900/20' : ''
                          }`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.severity === 'extreme' ? 'bg-red-500' :
                              notification.severity === 'high' ? 'bg-orange-500' :
                              notification.severity === 'medium' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`} />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="font-medium text-sm">{notification.title}</h5>
                                <span className="text-xs text-slate-400">
                                  {new Date(notification.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 mb-1">{notification.description}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-xs ${
                                  notification.severity === 'extreme' ? 'border-red-500 text-red-300' :
                                  notification.severity === 'high' ? 'border-orange-500 text-orange-300' :
                                  notification.severity === 'medium' ? 'border-yellow-500 text-yellow-300' :
                                  'border-green-500 text-green-300'
                                }`}>
                                  {notification.severity}
                                </Badge>
                                <span className="text-xs text-slate-400">{notification.location}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Search Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/50 border-blue-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5" />
                  Weather Query
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Check weather conditions for your event location and time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <Input
                      id="location"
                      placeholder="Enter city or address"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                    {locationSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {isSearchingLocation ? (
                          <div className="p-3 text-sm text-slate-400">Searching...</div>
                        ) : (
                          locationSuggestions.map((suggestion) => (
                            <div
                              key={suggestion.id}
                              className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700 last:border-b-0"
                              onClick={() => handleLocationSelect(suggestion)}
                            >
                              <div className="font-medium text-sm">{suggestion.name}</div>
                              <div className="text-xs text-slate-400">
                                {suggestion.address.city && `${suggestion.address.city}, `}
                                {suggestion.address.state && `${suggestion.address.state}, `}
                                {suggestion.address.country}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          console.log('Date selected:', date)
                          setSelectedDate(date)
                        }}
                        initialFocus
                        className="bg-slate-800 text-white"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="outdoor">Outdoor Event</SelectItem>
                      <SelectItem value="parade">Parade</SelectItem>
                      <SelectItem value="concert">Concert</SelectItem>
                      <SelectItem value="sports">Sports Event</SelectItem>
                      <SelectItem value="wedding">Wedding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleSearch} 
                  disabled={!selectedLocation || !selectedDate || isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Analyzing Weather...' : 'Check Weather Risk'}
                </Button>
                
                {selectedLocation && (
                  <Button 
                    onClick={saveLocation}
                    variant="outline"
                    className="w-full border-green-500 text-green-300 hover:bg-green-600"
                  >
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    Save Location
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Risk Assessment */}
            {weatherData && (
              <Card className="mt-6 bg-slate-800/50 border-blue-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangleIcon className="w-5 h-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Weather Risk Level</span>
                    <Badge className={`${getRiskColor(riskLevel)} text-white`}>
                      {riskLevel}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    <p>• High precipitation probability detected</p>
                    <p>• Strong winds may affect outdoor activities</p>
                    <p>• Consider indoor alternatives</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Weather Display with Enhanced Google Map */}
          <div className="lg:col-span-2">
            {!weatherData ? (
              // Show Enhanced Google Map when no weather data is loaded
              <Card className="bg-slate-800/50 border-blue-700 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPinIcon className="w-5 h-5" />
                      Interactive Location Map
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={toggleDrawingMode}
                        variant={mapMode === 'draw' ? "default" : "outline"}
                        size="sm"
                        className={mapMode === 'draw' ? "bg-green-600 hover:bg-green-700" : "border-blue-500 text-blue-300 hover:bg-blue-600"}
                      >
                        <Square className="w-4 h-4 mr-2" />
                        {mapMode === 'draw' ? 'Drawing...' : 'Draw Region'}
                      </Button>
                      {drawnRegion.length > 0 && (
                        <Button
                          onClick={clearDrawnRegion}
                          variant="outline"
                          size="sm"
                          className="border-red-500 text-red-300 hover:bg-red-600"
                        >
                          Clear
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          setMapCenter(defaultCenter)
                          setMapZoom(2)
                          setSelectedLocation(null)
                          setDrawnRegion([])
                          setMapMode('select')
                        }}
                        variant="outline"
                        size="sm"
                        className="border-purple-500 text-purple-300 hover:bg-purple-600"
                      >
                        <Navigation className="w-4 h-4 mr-2" />
                        Reset View
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="text-slate-300">
                    {mapMode === 'draw' 
                      ? 'Click on the map to draw a region. Click "Draw Region" again to finish.' 
                      : 'Click on the map or search to select a location'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96 rounded-lg overflow-hidden relative">
                    <LoadScript
                      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
                    >
                      <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={mapZoom}
                        onLoad={handleMapLoad}
                        onClick={handleMapClick}
                        options={{
                          styles: [
                            {
                              featureType: "all",
                              elementType: "geometry",
                              stylers: [{ color: "#1e293b" }]
                            },
                            {
                              featureType: "all",
                              elementType: "labels.text.stroke",
                              stylers: [{ color: "#1e293b" }]
                            },
                            {
                              featureType: "all",
                              elementType: "labels.text.fill",
                              stylers: [{ color: "#747474" }]
                            },
                            {
                              featureType: "water",
                              elementType: "geometry",
                              stylers: [{ color: "#0f172a" }]
                            },
                            {
                              featureType: "water",
                              elementType: "labels.text.fill",
                              stylers: [{ color: "#3d3d3d" }]
                            }
                          ],
                          disableDefaultUI: false,
                          zoomControl: true,
                          streetViewControl: false,
                          mapTypeControl: false,
                          fullscreenControl: true
                        }}
                      >
                        {selectedLocation && !selectedLocation.region && (
                          <Marker
                            position={{
                              lat: selectedLocation.latitude,
                              lng: selectedLocation.longitude
                            }}
                            animation={window.google?.maps?.Animation?.DROP}
                            icon={{
                              url: 'data:image/svg+xml;base64,' + btoa(`
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M16 2C11.58 2 8 5.58 8 10C8 16.32 16 30 16 30C16 30 24 16.32 24 10C24 5.58 20.42 2 16 2Z" fill="#3B82F6"/>
                                  <path d="M16 13C17.6569 13 19 11.6569 19 10C19 8.34315 17.6569 7 16 7C14.3431 7 13 8.34315 13 10C13 11.6569 14.3431 13 16 13Z" fill="white"/>
                                </svg>
                              `),
                              scaledSize: new window.google.maps.Size(32, 32),
                              anchor: new window.google.maps.Point(16, 32)
                            }}
                          />
                        )}
                        
                        {/* Draw region polygon if points exist */}
                        {(drawnRegion.length > 0 || selectedLocation?.region) && (
                          <Polygon
                            paths={drawnRegion.length > 0 ? drawnRegion : selectedLocation.region}
                            options={{
                              fillColor: '#3B82F6',
                              fillOpacity: 0.2,
                              strokeColor: '#3B82F6',
                              strokeOpacity: 0.8,
                              strokeWeight: 2
                            }}
                          />
                        )}
                      </GoogleMap>
                    </LoadScript>

                    {/* Map mode indicator */}
                    <div className="absolute top-4 left-4 z-[1000]">
                      <Badge 
                        variant="outline" 
                        className={
                          mapMode === 'draw' 
                            ? 'bg-green-900/80 border-green-500 text-green-300' 
                            : 'bg-blue-900/80 border-blue-500 text-blue-300'
                        }
                      >
                        {mapMode === 'draw' ? 'Region Drawing Mode' : 'Location Selection Mode'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-4">
                    <div className="p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MapPinIcon className="w-5 h-5 text-blue-400" />
                        <div>
                          <h4 className="font-semibold text-sm">How to use the map</h4>
                          <p className="text-xs text-slate-300 mt-1">
                            • <strong>Click</strong> anywhere to select a single location<br/>
                            • Use <strong>Draw Region</strong> to select an area by clicking multiple points<br/>
                            • <strong>Search</strong> for specific places to automatically move the map<br/>
                            • Selected regions will show weather analysis for the entire area
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Selected location/region info */}
                    {selectedLocation && (
                      <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                        <h4 className="font-semibold text-sm text-blue-400 mb-2">
                          {selectedLocation.region ? 'Selected Region' : 'Selected Location'}
                        </h4>
                        <p className="text-sm text-slate-300">{selectedLocation.name}</p>
                        {selectedLocation.region && (
                          <p className="text-xs text-slate-400 mt-1">
                            Custom region with {selectedLocation.region.length} points
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Show weather data when available (existing code remains the same)
              <div className="space-y-6">
                {/* Current Weather */}
                <Card className="bg-slate-800/50 border-blue-700 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Weather Forecast</span>
                      <Badge variant="outline" className="border-blue-500 text-blue-300">
                        {weatherData.conditions}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {weatherData.location} • {format(weatherData.date, "PPP")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <ThermometerIcon className="w-8 h-8 mx-auto mb-2 text-red-400" />
                        <div className="text-2xl font-bold">{weatherData.temperature}°C</div>
                        <div className="text-sm text-slate-300">Temperature</div>
                      </div>
                      <div className="text-center">
                        <DropletsIcon className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                        <div className="text-2xl font-bold">{weatherData.humidity}%</div>
                        <div className="text-sm text-slate-300">Humidity</div>
                      </div>
                      <div className="text-center">
                        <WindIcon className="w-8 h-8 mx-auto mb-2 text-green-400" />
                        <div className="text-2xl font-bold">{weatherData.windSpeed} km/h</div>
                        <div className="text-sm text-slate-300">Wind Speed</div>
                      </div>
                      <div className="text-center">
                        <CloudIcon className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                        <div className="text-2xl font-bold">{weatherData.precipitation}%</div>
                        <div className="text-sm text-slate-300">Precipitation</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                
                {/* Detailed Analysis */}
                <Tabs defaultValue="hourly" className="bg-slate-800/50 border-blue-700 rounded-lg p-6 backdrop-blur-sm">
                  <TabsList className="grid w-full grid-cols-9 bg-slate-700">
                    <TabsTrigger value="hourly">Hourly Forecast</TabsTrigger>
                    <TabsTrigger value="analysis">Risk Analysis</TabsTrigger>
                    <TabsTrigger value="wet-conditions">Wet Conditions</TabsTrigger>
                    <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
                    <TabsTrigger value="history">History & Trends</TabsTrigger>
                    <TabsTrigger value="ai-prediction">AI Analysis</TabsTrigger>
                    <TabsTrigger value="satellite">Satellite</TabsTrigger>
                    <TabsTrigger value="patterns">Patterns</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="hourly" className="mt-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">24-Hour Forecast</h3>
                      <div className="grid grid-cols-6 gap-2 text-center">
                        {weatherData.hourlyForecast.map((hour: any, index: number) => (
                          <div key={index} className="p-2 bg-slate-700 rounded">
                            <div className="text-xs text-slate-300">{hour.time}</div>
                            <div className="text-sm font-semibold">{hour.temperature}°</div>
                            <div className="text-xs text-blue-400">{hour.precipitation}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="analysis" className="mt-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Advanced Risk Analysis</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card className="bg-slate-700 border-slate-600">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Precipitation Risk</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-blue-400">{weatherData.riskAnalysis.precipitationRisk.level}</div>
                            <div className="text-xs text-slate-300">{weatherData.riskAnalysis.precipitationRisk.description}</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-slate-700 border-slate-600">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Wind Impact</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-400">{weatherData.riskAnalysis.windImpact.level}</div>
                            <div className="text-xs text-slate-300">{weatherData.riskAnalysis.windImpact.description}</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-slate-700 border-slate-600">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Temperature Comfort</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-red-400">{weatherData.riskAnalysis.temperatureComfort.level}</div>
                            <div className="text-xs text-slate-300">{weatherData.riskAnalysis.temperatureComfort.description}</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="wet-conditions" className="mt-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Advanced Wet Conditions Analysis</h3>
                      
                      {/* Wet Conditions Risk Level */}
                      <Card className="bg-slate-700 border-slate-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Wet Conditions Risk Assessment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-2xl font-bold text-blue-400">
                              {weatherData.advancedAnalysis.wetConditionsRisk.level}
                            </span>
                            <div className="text-sm text-slate-300">
                              Score: {weatherData.advancedAnalysis.wetConditionsRisk.factors.overallScore}/100
                            </div>
                          </div>
                          <p className="text-sm text-slate-300 mb-4">
                            {weatherData.advancedAnalysis.wetConditionsRisk.description}
                          </p>
                          
                          {/* Risk Factors Breakdown */}
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                              <div className="text-lg font-semibold text-blue-400">
                                {weatherData.advancedAnalysis.wetConditionsRisk.factors.precipitationRisk}%
                              </div>
                              <div className="text-xs text-slate-400">Precipitation</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-green-400">
                                {weatherData.advancedAnalysis.wetConditionsRisk.factors.humidityContribution}%
                              </div>
                              <div className="text-xs text-slate-400">Humidity</div>
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-purple-400">
                                {weatherData.advancedAnalysis.wetConditionsRisk.factors.windImpact}%
                              </div>
                              <div className="text-xs text-slate-400">Wind Impact</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recommendations */}
                      <Card className="bg-slate-700 border-slate-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Wet Weather Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {weatherData.advancedAnalysis.wetConditionsRisk.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-sm text-slate-300 flex items-start">
                                <span className="text-blue-400 mr-2">•</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Severe Weather Probability */}
                      <Card className="bg-slate-700 border-slate-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Severe Weather Probability</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className={`text-lg font-semibold ${
                                weatherData.advancedAnalysis.severeWeatherProbability.thunderstorm === 'High' 
                                  ? 'text-red-400' 
                                  : weatherData.advancedAnalysis.severeWeatherProbability.thunderstorm === 'Moderate'
                                  ? 'text-yellow-400'
                                  : 'text-green-400'
                              }`}>
                                {weatherData.advancedAnalysis.severeWeatherProbability.thunderstorm}
                              </div>
                              <div className="text-xs text-slate-400">Thunderstorm</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-lg font-semibold ${
                                weatherData.advancedAnalysis.severeWeatherProbability.flooding === 'High' 
                                  ? 'text-red-400' 
                                  : weatherData.advancedAnalysis.severeWeatherProbability.flooding === 'Moderate'
                                  ? 'text-yellow-400'
                                  : 'text-green-400'
                              }`}>
                                {weatherData.advancedAnalysis.severeWeatherProbability.flooding}
                              </div>
                              <div className="text-xs text-slate-400">Flooding</div>
                            </div>
                            <div className="text-center">
                              <div className={`text-lg font-semibold ${
                                weatherData.advancedAnalysis.severeWeatherProbability.windDamage === 'High' 
                                  ? 'text-red-400' 
                                  : weatherData.advancedAnalysis.severeWeatherProbability.windDamage === 'Moderate'
                                  ? 'text-yellow-400'
                                  : 'text-green-400'
                              }`}>
                                {weatherData.advancedAnalysis.severeWeatherProbability.windDamage}
                              </div>
                              <div className="text-xs text-slate-400">Wind Damage</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="visualizations" className="mt-4">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Weather Data Visualizations</h3>
                      
                      {/* Temperature Trend Chart */}
                      <Card className="bg-slate-700 border-slate-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">24-Hour Temperature Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={weatherData.hourlyForecast}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <XAxis 
                                  dataKey="time" 
                                  stroke="#94a3b8"
                                  fontSize={12}
                                />
                                <YAxis 
                                  stroke="#94a3b8"
                                  fontSize={12}
                                  domain={['dataMin - 5', 'dataMax + 5']}
                                />
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '0.5rem',
                                  }}
                                  labelStyle={{ color: '#f1f5f9' }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="temperature" 
                                  stroke="#ef4444" 
                                  strokeWidth={2}
                                  dot={{ fill: '#ef4444', strokeWidth: 2 }}
                                  activeDot={{ r: 6 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Precipitation Probability Chart */}
                      <Card className="bg-slate-700 border-slate-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Precipitation Probability</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={weatherData.hourlyForecast}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <XAxis 
                                  dataKey="time" 
                                  stroke="#94a3b8"
                                  fontSize={12}
                                />
                                <YAxis 
                                  stroke="#94a3b8"
                                  fontSize={12}
                                  domain={[0, 100]}
                                />
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '0.5rem',
                                  }}
                                  labelStyle={{ color: '#f1f5f9' }}
                                  formatter={(value) => [`${value}%`, 'Precipitation']}
                                />
                                <Bar 
                                  dataKey="precipitation" 
                                  fill="#3b82f6"
                                  radius={[2, 2, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Weather Conditions Distribution */}
                      <Card className="bg-slate-700 border-slate-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Weather Conditions Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={weatherData.hourlyForecast.reduce((acc: any[], hour: any) => {
                                    const existing = acc.find(item => item.name === hour.conditions)
                                    if (existing) {
                                      existing.value += 1
                                    } else {
                                      acc.push({ name: hour.conditions, value: 1 })
                                    }
                                    return acc
                                  }, [])}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                  {[
                                    { name: 'Sunny', color: '#fbbf24' },
                                    { name: 'Partly Cloudy', color: '#60a5fa' },
                                    { name: 'Cloudy', color: '#94a3b8' },
                                    { name: 'Rainy', color: '#3b82f6' },
                                    { name: 'Thunderstorm', color: '#8b5cf6' }
                                  ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '0.5rem',
                                  }}
                                  labelStyle={{ color: '#f1f5f9' }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Risk Analysis Chart */}
                      <Card className="bg-slate-700 border-slate-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Risk Factors Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart 
                                data={[
                                  {
                                    name: 'Precipitation',
                                    value: weatherData.advancedAnalysis.wetConditionsRisk.factors.precipitationRisk,
                                    color: '#3b82f6'
                                  },
                                  {
                                    name: 'Humidity',
                                    value: weatherData.advancedAnalysis.wetConditionsRisk.factors.humidityContribution,
                                    color: '#10b981'
                                  },
                                  {
                                    name: 'Wind',
                                    value: weatherData.advancedAnalysis.wetConditionsRisk.factors.windImpact,
                                    color: '#8b5cf6'
                                  }
                                ]}
                                layout="horizontal"
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <XAxis 
                                  type="number"
                                  stroke="#94a3b8"
                                  fontSize={12}
                                  domain={[0, 100]}
                                />
                                <YAxis 
                                  type="category"
                                  dataKey="name"
                                  stroke="#94a3b8"
                                  fontSize={12}
                                />
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '0.5rem',
                                  }}
                                  labelStyle={{ color: '#f1f5f9' }}
                                  formatter={(value) => [`${value}%`, 'Risk Factor']}
                                />
                                <Bar 
                                  dataKey="value" 
                                  fill="#8884d8"
                                  radius={[0, 4, 4, 0]}
                                >
                                  {[
                                    { name: 'Precipitation', color: '#3b82f6' },
                                    { name: 'Humidity', color: '#10b981' },
                                    { name: 'Wind', color: '#8b5cf6' }
                                  ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="history" className="mt-4">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Historical Weather Data & Trends</h3>
                      
                      {/* Trend Summary Cards */}
                      <div className="grid md:grid-cols-4 gap-4">
                        <Card className="bg-slate-700 border-slate-600">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Temperature Trend</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className={`text-lg font-semibold ${
                              weatherData.trendAnalysis?.temperatureTrend === 'rising' ? 'text-red-400' :
                              weatherData.trendAnalysis?.temperatureTrend === 'falling' ? 'text-blue-400' :
                              'text-green-400'
                            }`}>
                              {weatherData.trendAnalysis?.temperatureTrend || 'stable'}
                            </div>
                            <div className="text-xs text-slate-300">
                              Avg: {weatherData.trendAnalysis?.averageTemperature || '--'}°C
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-slate-700 border-slate-600">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Precipitation Trend</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className={`text-lg font-semibold ${
                              weatherData.trendAnalysis?.precipitationTrend === 'increasing' ? 'text-blue-400' :
                              weatherData.trendAnalysis?.precipitationTrend === 'decreasing' ? 'text-orange-400' :
                              'text-green-400'
                            }`}>
                              {weatherData.trendAnalysis?.precipitationTrend || 'stable'}
                            </div>
                            <div className="text-xs text-slate-300">
                              Avg: {weatherData.trendAnalysis?.averagePrecipitation || '--'}%
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-slate-700 border-slate-600">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Extreme Weather Days</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-lg font-semibold text-red-400">
                              {weatherData.trendAnalysis?.extremeWeatherDays || '--'}
                            </div>
                            <div className="text-xs text-slate-300">
                              Last 30 days
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-slate-700 border-slate-600">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Most Common</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-lg font-semibold text-purple-400">
                              {weatherData.trendAnalysis?.mostCommonCondition || '--'}
                            </div>
                            <div className="text-xs text-slate-300">
                              Weather condition
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Weekly Patterns */}
                      <Card className="bg-slate-700 border-slate-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Weekly Weather Patterns</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-7 gap-2">
                            {Object.entries(weatherData.trendAnalysis?.weeklyPatterns || {}).map(([day, data]: [string, any]) => (
                              <div key={day} className="text-center p-2 bg-slate-600 rounded">
                                <div className="text-xs font-medium text-slate-300 mb-1">{day.substring(0, 3)}</div>
                                <div className="text-sm font-semibold text-blue-400">{data.avgTemp}°</div>
                                <div className="text-xs text-green-400">{data.avgPrecipitation}%</div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Historical Temperature Chart */}
                      <Card className="bg-slate-700 border-slate-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">30-Day Temperature Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={weatherData.historicalData?.slice(-30) || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <XAxis 
                                  dataKey="date" 
                                  stroke="#94a3b8"
                                  fontSize={10}
                                  tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis 
                                  stroke="#94a3b8"
                                  fontSize={12}
                                />
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '0.5rem',
                                  }}
                                  labelStyle={{ color: '#f1f5f9' }}
                                  formatter={(value) => [`${value}°C`, 'Temperature']}
                                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="temperature" 
                                  stroke="#ef4444" 
                                  strokeWidth={2}
                                  dot={{ fill: '#ef4444', strokeWidth: 1, r: 3 }}
                                  activeDot={{ r: 5 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Historical Precipitation Chart */}
                      <Card className="bg-slate-700 border-slate-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">30-Day Precipitation History</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={weatherData.historicalData?.slice(-30) || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                <XAxis 
                                  dataKey="date" 
                                  stroke="#94a3b8"
                                  fontSize={10}
                                  tickFormatter={(value) => new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                />
                                <YAxis 
                                  stroke="#94a3b8"
                                  fontSize={12}
                                  domain={[0, 100]}
                                />
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '0.5rem',
                                  }}
                                  labelStyle={{ color: '#f1f5f9' }}
                                  formatter={(value) => [`${value}%`, 'Precipitation']}
                                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                                />
                                <Bar 
                                  dataKey="precipitation" 
                                  fill="#3b82f6"
                                  radius={[2, 2, 0, 0]}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Weather Insights */}
                      <Card className="bg-slate-700 border-slate-600">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Weather Insights & Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                              <h4 className="font-semibold text-blue-400 text-sm mb-1">Temperature Analysis</h4>
                              <p className="text-xs text-slate-300">
                                {weatherData.trendAnalysis?.temperatureTrend === 'rising' ? 
                                  'Temperatures have been rising recently. Consider lighter clothing and increased hydration.' :
                                  weatherData.trendAnalysis?.temperatureTrend === 'falling' ?
                                  'Temperatures have been decreasing. Prepare for cooler conditions and layer clothing.' :
                                  'Temperatures have been stable. Typical seasonal patterns are expected.'
                                }
                              </p>
                            </div>
                            
                            <div className="p-3 bg-green-900/20 border border-green-700 rounded-lg">
                              <h4 className="font-semibold text-green-400 text-sm mb-1">Precipitation Analysis</h4>
                              <p className="text-xs text-slate-300">
                                {weatherData.trendAnalysis?.precipitationTrend === 'increasing' ? 
                                  'Precipitation has been increasing. Expect wetter conditions and prepare for potential flooding.' :
                                  weatherData.trendAnalysis?.precipitationTrend === 'decreasing' ?
                                  'Precipitation has been decreasing. Drier conditions expected, monitor for drought concerns.' :
                                  'Precipitation levels have been stable. Normal rainfall patterns expected.'
                                }
                              </p>
                            </div>
                            
                            <div className="p-3 bg-purple-900/20 border border-purple-700 rounded-lg">
                              <h4 className="font-semibold text-purple-400 text-sm mb-1">Weekly Patterns</h4>
                              <p className="text-xs text-slate-300">
                                {weatherData.trendAnalysis?.mostCommonCondition === 'Sunny' ? 
                                  'Sunny conditions dominate. Great for outdoor activities and events.' :
                                  weatherData.trendAnalysis?.mostCommonCondition === 'Rainy' ?
                                  'Frequent rainfall expected. Always have indoor backup plans ready.' :
                                  weatherData.trendAnalysis?.mostCommonCondition === 'Cloudy' ?
                                  'Mostly cloudy conditions. Plan for variable weather and have flexible arrangements.' :
                                  'Mixed conditions typical. Stay prepared for changing weather patterns.'
                                }
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  {/* AI Analysis Tab */}
                  <TabsContent value="ai-prediction" className="mt-4">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">AI-Powered Weather Intelligence</h3>
                      
                      {isAdvancedLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                          <p className="text-slate-300">Analyzing with advanced AI models...</p>
                        </div>
                      ) : aiPrediction ? (
                        <>
                          {/* AI Overall Assessment */}
                          <Card className="bg-slate-700 border-slate-600">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                AI Assessment
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Confidence Level</span>
                                  <Badge variant="outline" className="border-green-500 text-green-300">
                                    {Math.round(aiPrediction.aiAnalysis.confidenceLevel * 100)}%
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-300">
                                  {aiPrediction.aiAnalysis.overallAssessment}
                                </p>
                                
                                {/* Key Factors */}
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-blue-400">Key Factors</h4>
                                  <div className="grid grid-cols-2 gap-2">
                                    {aiPrediction.aiAnalysis.keyFactors.slice(0, 4).map((factor: string, index: number) => (
                                      <div key={index} className="p-2 bg-slate-600 rounded text-xs">
                                        {factor}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Risk Prediction */}
                          <Card className="bg-slate-700 border-slate-600">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">AI Risk Prediction</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-lg font-semibold text-blue-400">
                                    {aiPrediction.aiAnalysis.riskPrediction.level}
                                  </span>
                                  <Badge variant="outline" className="border-blue-500 text-blue-300">
                                    {Math.round(aiPrediction.aiAnalysis.riskPrediction.probability)}% probability
                                  </Badge>
                                </div>
                                <p className="text-sm text-slate-300">
                                  {aiPrediction.aiAnalysis.riskPrediction.reasoning}
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Predictive Insights */}
                          <div className="grid md:grid-cols-3 gap-4">
                            <Card className="bg-slate-700 border-slate-600">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-xs">Short-term (0-6h)</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-1">
                                  {aiPrediction.aiAnalysis.predictiveInsights.shortTerm.slice(0, 2).map((insight: string, index: number) => (
                                    <li key={index} className="text-xs text-slate-300">• {insight}</li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                            
                            <Card className="bg-slate-700 border-slate-600">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-xs">Medium-term (6-24h)</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-1">
                                  {aiPrediction.aiAnalysis.predictiveInsights.mediumTerm.slice(0, 2).map((insight: string, index: number) => (
                                    <li key={index} className="text-xs text-slate-300">• {insight}</li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                            
                            <Card className="bg-slate-700 border-slate-600">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-xs">Long-term (24-72h)</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-1">
                                  {aiPrediction.aiAnalysis.predictiveInsights.longTerm.slice(0, 2).map((insight: string, index: number) => (
                                    <li key={index} className="text-xs text-slate-300">• {insight}</li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          </div>

                          {/* NASA Integration */}
                          <Card className="bg-slate-700 border-slate-600">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">NASA Integration</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid md:grid-cols-3 gap-4 text-center">
                                <div>
                                  <div className="text-sm font-semibold text-green-400">
                                    {aiPrediction.nasaIntegration.satelliteData.available ? 'Available' : 'Unavailable'}
                                  </div>
                                  <div className="text-xs text-slate-400">Satellite Data</div>
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-blue-400">
                                    {aiPrediction.nasaIntegration.climateModels.accuracy * 100}%
                                  </div>
                                  <div className="text-xs text-slate-400">Model Accuracy</div>
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-purple-400">
                                    {aiPrediction.nasaIntegration.spaceWeather.impact}
                                  </div>
                                  <div className="text-xs text-slate-400">Space Weather</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      ) : (
                        <Card className="bg-slate-700 border-slate-600">
                          <CardContent className="flex items-center justify-center h-32">
                            <p className="text-slate-400">AI analysis not available</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Satellite Imagery Tab */}
                  <TabsContent value="satellite" className="mt-4">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">NASA Satellite Imagery Analysis</h3>
                      
                      {isAdvancedLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                          <p className="text-slate-300">Processing satellite imagery...</p>
                        </div>
                      ) : satelliteImagery ? (
                        <>
                          {/* Satellite Image */}
                          <Card className="bg-slate-700 border-slate-600">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Latest Satellite Image</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="relative">
                                  <img 
                                    src={satelliteImagery.imageryData.satelliteImages[0]?.imageUrl || ''} 
                                    alt="Satellite imagery"
                                    className="w-full h-64 object-cover rounded-lg"
                                  />
                                  <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs">
                                    {satelliteImagery.imageryData.satelliteImages[0]?.quality || 'Good'} Quality
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                  <div className="text-center">
                                    <div className="font-semibold">Cloud Cover</div>
                                    <div className="text-blue-400">
                                      {satelliteImagery.imageryData.analysis.cloudCoverage.percentage}%
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-semibold">Density</div>
                                    <div className="text-green-400">
                                      {satelliteImagery.imageryData.analysis.cloudCoverage.density}
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-semibold">Precipitation</div>
                                    <div className="text-purple-400">
                                      {satelliteImagery.imageryData.analysis.precipitationIndicators.detected ? 'Detected' : 'None'}
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-semibold">Visibility</div>
                                    <div className="text-yellow-400">
                                      {satelliteImagery.imageryData.analysis.atmosphericConditions.visibility}km
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Cloud Analysis */}
                          <Card className="bg-slate-700 border-slate-600">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Cloud Analysis</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid md:grid-cols-3 gap-4">
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-blue-400">
                                    {satelliteImagery.imageryData.analysis.cloudCoverage.percentage}%
                                  </div>
                                  <div className="text-xs text-slate-400">Total Coverage</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-green-400">
                                    {satelliteImagery.imageryData.analysis.cloudCoverage.altitude.low / 1000}k
                                  </div>
                                  <div className="text-xs text-slate-400">Low Clouds</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-purple-400">
                                    {satelliteImagery.imageryData.analysis.cloudCoverage.altitude.high / 1000}k
                                  </div>
                                  <div className="text-xs text-slate-400">High Clouds</div>
                                </div>
                              </div>
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold mb-2">Cloud Types</h4>
                                <div className="flex flex-wrap gap-2">
                                  {satelliteImagery.imageryData.analysis.cloudCoverage.type.map((type: string, index: number) => (
                                    <Badge key={index} variant="outline" className="border-blue-500 text-blue-300 text-xs">
                                      {type}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* NASA Data Sources */}
                          <Card className="bg-slate-700 border-slate-600">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">NASA Data Sources</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {satelliteImagery.nasaIntegration.dataSources.slice(0, 3).map((source: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-slate-600 rounded">
                                    <div>
                                      <div className="text-sm font-medium">{source.name}</div>
                                      <div className="text-xs text-slate-400">{source.type} • {source.resolution}</div>
                                    </div>
                                    <Badge variant="outline" className="border-green-500 text-green-300 text-xs">
                                      {source.coverage}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      ) : (
                        <Card className="bg-slate-700 border-slate-600">
                          <CardContent className="flex items-center justify-center h-32">
                            <p className="text-slate-400">Satellite imagery not available</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Weather Patterns Tab */}
                  <TabsContent value="patterns" className="mt-4">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Machine Learning Pattern Recognition</h3>
                      
                      {isAdvancedLoading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                          <p className="text-slate-300">Analyzing weather patterns...</p>
                        </div>
                      ) : weatherPatterns ? (
                        <>
                          {/* Detected Patterns */}
                          <Card className="bg-slate-700 border-slate-600">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Detected Weather Patterns</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {weatherPatterns.patternRecognition.detectedPatterns.slice(0, 3).map((pattern: any, index: number) => (
                                  <div key={index} className="p-3 bg-slate-600 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="text-sm font-semibold">{pattern.type}</h4>
                                      <Badge variant="outline" className="border-blue-500 text-blue-300 text-xs">
                                        {Math.round(pattern.confidence * 100)}% confidence
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-slate-300 mb-2">{pattern.description}</p>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                      <div>
                                        <span className="text-blue-400">Frequency:</span> {pattern.characteristics.frequency}
                                      </div>
                                      <div>
                                        <span className="text-green-400">Duration:</span> {pattern.characteristics.duration}
                                      </div>
                                      <div>
                                        <span className="text-purple-400">Predictability:</span> {Math.round(pattern.characteristics.predictability * 100)}%
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Machine Learning Insights */}
                          <Card className="bg-slate-700 border-slate-600">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">ML Model Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid md:grid-cols-4 gap-4 text-center">
                                <div>
                                  <div className="text-lg font-semibold text-green-400">
                                    {Math.round(weatherPatterns.patternRecognition.machineLearningInsights.modelAccuracy * 100)}%
                                  </div>
                                  <div className="text-xs text-slate-400">Accuracy</div>
                                </div>
                                <div>
                                  <div className="text-lg font-semibold text-blue-400">
                                    {weatherPatterns.patternRecognition.machineLearningInsights.trainingDataPoints.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-slate-400">Training Points</div>
                                </div>
                                <div>
                                  <div className="text-lg font-semibold text-purple-400">
                                    {Math.round(weatherPatterns.patternRecognition.machineLearningInsights.modelPerformance.f1Score * 100)}%
                                  </div>
                                  <div className="text-xs text-slate-400">F1 Score</div>
                                </div>
                                <div>
                                  <div className="text-lg font-semibold text-yellow-400">
                                    {Math.round(weatherPatterns.patternRecognition.machineLearningInsights.predictionConfidence.shortTerm * 100)}%
                                  </div>
                                  <div className="text-xs text-slate-400">Short-term Confidence</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Anomaly Detection */}
                          <Card className="bg-slate-700 border-slate-600">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Anomaly Detection</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {weatherPatterns.patternRecognition.anomalyDetection.anomalies.length > 0 ? (
                                <div className="space-y-3">
                                  {weatherPatterns.patternRecognition.anomalyDetection.anomalies.slice(0, 2).map((anomaly: any, index: number) => (
                                    <div key={index} className="p-3 bg-slate-600 rounded-lg border-l-4 border-red-500">
                                      <div className="flex items-center justify-between mb-1">
                                        <h4 className="text-sm font-semibold">{anomaly.type}</h4>
                                        <Badge variant="outline" className={`${
                                          anomaly.severity === 'Critical' ? 'border-red-500 text-red-300' :
                                          anomaly.severity === 'High' ? 'border-orange-500 text-orange-300' :
                                          anomaly.severity === 'Medium' ? 'border-yellow-500 text-yellow-300' :
                                          'border-green-500 text-green-300'
                                        } text-xs`}>
                                          {anomaly.severity}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-slate-300">{anomaly.description}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-400 text-center py-4">
                                  No significant weather anomalies detected
                                </p>
                              )}
                            </CardContent>
                          </Card>

                          {/* Climate Signals */}
                          <Card className="bg-slate-700 border-slate-600">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Climate Signals</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">Temperature Trend</h4>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                      weatherPatterns.advancedAnalytics.climateSignals.longTermTrends.temperature.trend === 'warming' ? 'bg-red-400' :
                                      weatherPatterns.advancedAnalytics.climateSignals.longTermTrends.temperature.trend === 'cooling' ? 'bg-blue-400' : 'bg-green-400'
                                    }`}></div>
                                    <span className="text-sm capitalize">
                                      {weatherPatterns.advancedAnalytics.climateSignals.longTermTrends.temperature.trend}
                                    </span>
                                    <Badge variant="outline" className="border-blue-500 text-blue-300 text-xs">
                                      {Math.round(weatherPatterns.advancedAnalytics.climateSignals.longTermTrends.temperature.significance * 100)}% significance
                                    </Badge>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">Precipitation Trend</h4>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                      weatherPatterns.advancedAnalytics.climateSignals.longTermTrends.precipitation.trend === 'increasing' ? 'bg-blue-400' :
                                      weatherPatterns.advancedAnalytics.climateSignals.longTermTrends.precipitation.trend === 'decreasing' ? 'bg-orange-400' : 'bg-green-400'
                                    }`}></div>
                                    <span className="text-sm capitalize">
                                      {weatherPatterns.advancedAnalytics.climateSignals.longTermTrends.precipitation.trend}
                                    </span>
                                    <Badge variant="outline" className="border-blue-500 text-blue-300 text-xs">
                                      {Math.round(weatherPatterns.advancedAnalytics.climateSignals.longTermTrends.precipitation.significance * 100)}% significance
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      ) : (
                        <Card className="bg-slate-700 border-slate-600">
                          <CardContent className="flex items-center justify-center h-32">
                            <p className="text-slate-400">Pattern analysis not available</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="recommendations" className="mt-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Event Recommendations</h3>
                      <div className="space-y-3">
                        <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                          <h4 className="font-semibold text-yellow-400">Weather Advisory</h4>
                          <p className="text-sm text-slate-300">{weatherData.recommendations.weatherAdvisory}</p>
                        </div>
                        <div className="p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                          <h4 className="font-semibold text-blue-400">Optimal Timing</h4>
                          <p className="text-sm text-slate-300">{weatherData.recommendations.optimalTiming}</p>
                        </div>
                        <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg">
                          <h4 className="font-semibold text-green-400">Backup Plans</h4>
                          <p className="text-sm text-slate-300">{weatherData.recommendations.backupPlans}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-blue-700 bg-blue-900/20 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-sm text-slate-300">
              © 2025 NASA Space Apps Challenge - Advanced Weather Prediction System
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Badge variant="outline" className="border-blue-500 text-blue-300">
                Earth Science Division
              </Badge>
              <Badge variant="outline" className="border-blue-500 text-blue-300">
                Intermediate Level
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}