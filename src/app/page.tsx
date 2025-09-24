'use client'

import { useState, useCallback, useEffect } from 'react'
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
import { CalendarIcon, MapPinIcon, CloudIcon, DropletsIcon, WindIcon, ThermometerIcon, AlertTriangleIcon, UserIcon, SettingsIcon, BellIcon, PlusIcon } from 'lucide-react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

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
  
  // Real-time notifications state
  const [notifications, setNotifications] = useState<any[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [socket, setSocket] = useState<any>(null)

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

  const handleLocationSearch = async (query: string) => {
    if (!query.trim()) {
      setLocationSuggestions([])
      return
    }
    
    setIsSearchingLocation(true)
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data.locations) {
        setLocationSuggestions(data.locations)
      }
    } catch (error) {
      console.error('Location search error:', error)
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
    setSelectedLocation(location)
    setLocation(location.name)
    setLocationSuggestions([])
  }

  const handleSearch = async () => {
    if (!selectedLocation || !selectedDate) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          date: selectedDate.toISOString(),
        }),
      })
      
      const data = await response.json()
      setWeatherData(data)
      setRiskLevel(data.riskLevel)
    } catch (error) {
      console.error('Error fetching weather data:', error)
    } finally {
      setIsLoading(false)
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
          isDefault: userLocations.length === 0
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
      {/* Header */}
      <header className="border-b border-blue-700 bg-blue-900/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold">NASA</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Will It Rain On My Parade?</h1>
                <p className="text-blue-300 text-sm">2025 NASA Space Apps Challenge</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="border-blue-500 text-blue-300">
                Advanced Weather Prediction
              </Badge>
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
                <Button variant="outline" size="sm" className="border-blue-500 text-blue-300 hover:bg-blue-600 relative">
                  <BellIcon className="w-4 h-4 mr-2" />
                  Alerts
                  {notifications.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center p-0">
                      {notifications.filter(n => !n.read).length}
                    </Badge>
                  )}
                </Button>
                
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
                        onSelect={setSelectedDate}
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

          {/* Weather Display */}
          <div className="lg:col-span-2">
            {weatherData ? (
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
                  <TabsList className="grid w-full grid-cols-6 bg-slate-700">
                    <TabsTrigger value="hourly">Hourly Forecast</TabsTrigger>
                    <TabsTrigger value="analysis">Risk Analysis</TabsTrigger>
                    <TabsTrigger value="wet-conditions">Wet Conditions</TabsTrigger>
                    <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
                    <TabsTrigger value="history">History & Trends</TabsTrigger>
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
            ) : (
              <Card className="bg-slate-800/50 border-blue-700 backdrop-blur-sm">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <CloudIcon className="w-16 h-16 mx-auto mb-4 text-blue-400 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Weather Forecast Dashboard</h3>
                    <p className="text-slate-300">Enter a location and date to get detailed weather analysis for your event.</p>
                  </div>
                </CardContent>
              </Card>
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