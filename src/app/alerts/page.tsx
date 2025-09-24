'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { AlertTriangleIcon, BellIcon, PlusIcon, MapPinIcon, CalendarIcon, TrashIcon, EditIcon } from 'lucide-react'
import { format } from 'date-fns'

interface WeatherAlert {
  id: string
  title: string
  description: string
  alertType: string
  severity: 'low' | 'medium' | 'high' | 'extreme'
  minPrecipitation?: number
  maxPrecipitation?: number
  minTemperature?: number
  maxTemperature?: number
  maxWindSpeed?: number
  weatherConditions: string[]
  eventDate: string
  isActive: boolean
  isTriggered: boolean
  triggeredAt?: string
  location: {
    id: string
    name: string
    city: string
    state: string
    country: string
  }
  createdAt: string
  updatedAt: string
}

interface UserLocation {
  id: string
  name: string
  city: string
  state: string
  country: string
  isDefault: boolean
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([])
  const [locations, setLocations] = useState<UserLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<WeatherAlert | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    alertType: 'precipitation',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'extreme',
    locationId: '',
    minPrecipitation: '',
    maxPrecipitation: '',
    minTemperature: '',
    maxTemperature: '',
    maxWindSpeed: '',
    weatherConditions: [] as string[],
    eventDate: new Date(),
    isActive: true
  })

  useEffect(() => {
    fetchAlerts()
    fetchLocations()
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/user/alerts')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/user/locations')
      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations || [])
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const handleCreateAlert = async () => {
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        alertType: formData.alertType,
        severity: formData.severity,
        locationId: formData.locationId,
        minPrecipitation: formData.minPrecipitation ? parseFloat(formData.minPrecipitation) : undefined,
        maxPrecipitation: formData.maxPrecipitation ? parseFloat(formData.maxPrecipitation) : undefined,
        minTemperature: formData.minTemperature ? parseFloat(formData.minTemperature) : undefined,
        maxTemperature: formData.maxTemperature ? parseFloat(formData.maxTemperature) : undefined,
        maxWindSpeed: formData.maxWindSpeed ? parseFloat(formData.maxWindSpeed) : undefined,
        weatherConditions: formData.weatherConditions,
        eventDate: formData.eventDate.toISOString(),
        isActive: formData.isActive
      }

      const response = await fetch('/api/user/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        await fetchAlerts()
        setIsCreateDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error creating alert:', error)
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/user/alerts/${alertId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchAlerts()
      }
    } catch (error) {
      console.error('Error deleting alert:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      alertType: 'precipitation',
      severity: 'medium',
      locationId: '',
      minPrecipitation: '',
      maxPrecipitation: '',
      minTemperature: '',
      maxTemperature: '',
      maxWindSpeed: '',
      weatherConditions: [],
      eventDate: new Date(),
      isActive: true
    })
    setEditingAlert(null)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'extreme': return 'bg-red-600 text-white'
      case 'high': return 'bg-orange-600 text-white'
      case 'medium': return 'bg-yellow-600 text-white'
      case 'low': return 'bg-green-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'extreme':
      case 'high':
        return <AlertTriangleIcon className="w-4 h-4" />
      default:
        return <BellIcon className="w-4 h-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
        <div className="container mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading alerts...</p>
          </div>
        </div>
      </div>
    )
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
                <h1 className="text-2xl font-bold">Weather Alerts</h1>
                <p className="text-blue-300 text-sm">2025 NASA Space Apps Challenge</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-4">
                <a href="/" className="text-blue-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Weather Check
                </a>
                <a href="/alerts" className="text-white bg-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Alerts
                </a>
              </nav>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create Alert
                  </Button>
                </DialogTrigger>
              <DialogContent className="bg-slate-800 border-blue-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BellIcon className="w-5 h-5" />
                    Create Weather Alert
                  </DialogTitle>
                  <DialogDescription className="text-slate-300">
                    Set up custom weather alerts for your locations and events
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="title">Alert Title</Label>
                        <Input
                          id="title"
                          placeholder="e.g., Parade Weather Alert"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className="bg-slate-700 border-slate-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          placeholder="Describe the alert conditions"
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          className="bg-slate-700 border-slate-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Alert Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Alert Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="alertType">Alert Type</Label>
                        <Select value={formData.alertType} onValueChange={(value) => setFormData({...formData, alertType: value})}>
                          <SelectTrigger className="bg-slate-700 border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="precipitation">Precipitation</SelectItem>
                            <SelectItem value="temperature">Temperature</SelectItem>
                            <SelectItem value="wind">Wind Speed</SelectItem>
                            <SelectItem value="conditions">Weather Conditions</SelectItem>
                            <SelectItem value="comprehensive">Comprehensive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="severity">Severity</Label>
                        <Select value={formData.severity} onValueChange={(value: any) => setFormData({...formData, severity: value})}>
                          <SelectTrigger className="bg-slate-700 border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="extreme">Extreme</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Location Selection */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Location</h3>
                    <div>
                      <Label htmlFor="location">Select Location</Label>
                      <Select value={formData.locationId} onValueChange={(value) => setFormData({...formData, locationId: value})}>
                        <SelectTrigger className="bg-slate-700 border-slate-600">
                          <SelectValue placeholder="Choose a location" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}, {location.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Weather Conditions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Weather Conditions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minPrecipitation">Min Precipitation (%)</Label>
                        <Input
                          id="minPrecipitation"
                          type="number"
                          placeholder="0"
                          value={formData.minPrecipitation}
                          onChange={(e) => setFormData({...formData, minPrecipitation: e.target.value})}
                          className="bg-slate-700 border-slate-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxPrecipitation">Max Precipitation (%)</Label>
                        <Input
                          id="maxPrecipitation"
                          type="number"
                          placeholder="100"
                          value={formData.maxPrecipitation}
                          onChange={(e) => setFormData({...formData, maxPrecipitation: e.target.value})}
                          className="bg-slate-700 border-slate-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="minTemperature">Min Temperature (°C)</Label>
                        <Input
                          id="minTemperature"
                          type="number"
                          placeholder="-10"
                          value={formData.minTemperature}
                          onChange={(e) => setFormData({...formData, minTemperature: e.target.value})}
                          className="bg-slate-700 border-slate-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxTemperature">Max Temperature (°C)</Label>
                        <Input
                          id="maxTemperature"
                          type="number"
                          placeholder="40"
                          value={formData.maxTemperature}
                          onChange={(e) => setFormData({...formData, maxTemperature: e.target.value})}
                          className="bg-slate-700 border-slate-600"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxWindSpeed">Max Wind Speed (km/h)</Label>
                        <Input
                          id="maxWindSpeed"
                          type="number"
                          placeholder="50"
                          value={formData.maxWindSpeed}
                          onChange={(e) => setFormData({...formData, maxWindSpeed: e.target.value})}
                          className="bg-slate-700 border-slate-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Event Date */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Event Date</h3>
                    <div>
                      <Label>Event Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.eventDate ? format(formData.eventDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                          <Calendar
                            mode="single"
                            selected={formData.eventDate}
                            onSelect={(date) => date && setFormData({...formData, eventDate: date})}
                            initialFocus
                            className="bg-slate-800 text-white"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="isActive">Active Alert</Label>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={handleCreateAlert}
                      disabled={!formData.title || !formData.locationId}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Create Alert
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Your Weather Alerts</h2>
          <p className="text-blue-300">Manage and monitor your custom weather alerts</p>
        </div>

        {alerts.length === 0 ? (
          <Card className="bg-slate-800/50 border-blue-700 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <BellIcon className="w-16 h-16 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Weather Alerts</h3>
              <p className="text-slate-400 text-center mb-6">
                Create your first weather alert to stay informed about conditions that matter to you.
              </p>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Create Your First Alert
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {alerts.map((alert) => (
              <Card key={alert.id} className="bg-slate-800/50 border-blue-700 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getSeverityIcon(alert.severity)}
                      <div>
                        <CardTitle className="text-xl">{alert.title}</CardTitle>
                        <CardDescription className="text-slate-300">
                          {alert.description}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      {alert.isTriggered && (
                        <Badge className="bg-red-600 text-white animate-pulse">
                          TRIGGERED
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Location Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <MapPinIcon className="w-4 h-4" />
                        <span className="font-medium">Location</span>
                      </div>
                      <p className="text-white">{alert.location.name}</p>
                      <p className="text-sm text-slate-400">
                        {alert.location.city}, {alert.location.state}
                      </p>
                    </div>

                    {/* Event Date */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="font-medium">Event Date</span>
                      </div>
                      <p className="text-white">
                        {format(new Date(alert.eventDate), "PPP")}
                      </p>
                    </div>

                    {/* Alert Conditions */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <AlertTriangleIcon className="w-4 h-4" />
                        <span className="font-medium">Conditions</span>
                      </div>
                      <div className="space-y-1">
                        {alert.minPrecipitation !== undefined && (
                          <p className="text-sm text-white">
                            Precipitation: {alert.minPrecipitation}% - {alert.maxPrecipitation}%
                          </p>
                        )}
                        {alert.minTemperature !== undefined && (
                          <p className="text-sm text-white">
                            Temperature: {alert.minTemperature}°C - {alert.maxTemperature}°C
                          </p>
                        )}
                        {alert.maxWindSpeed !== undefined && (
                          <p className="text-sm text-white">
                            Max Wind: {alert.maxWindSpeed} km/h
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${alert.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-slate-300">
                        {alert.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {alert.triggeredAt && (
                        <span className="text-sm text-red-400 ml-4">
                          Triggered: {format(new Date(alert.triggeredAt), "PPp")}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <EditIcon className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="border-red-600 text-red-400 hover:bg-red-600"
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}