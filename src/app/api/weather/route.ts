import { NextRequest, NextResponse } from 'next/server'

interface WeatherRequest {
  latitude: number
  longitude: number
  date: string
  eventType?: string
}

interface WeatherData {
  location: string
  date: string
  temperature: number
  humidity: number
  windSpeed: number
  precipitation: number
  conditions: string
  riskLevel: 'Low' | 'Medium' | 'High'
  hourlyForecast: Array<{
    time: string
    temperature: number
    precipitation: number
    conditions: string
  }>
  recommendations: {
    weatherAdvisory: string
    optimalTiming: string
    backupPlans: string
  }
  riskAnalysis: {
    precipitationRisk: {
      level: string
      description: string
    }
    windImpact: {
      level: string
      description: string
    }
    temperatureComfort: {
      level: string
      description: string
    }
  }
}

function calculateWetConditionsRisk(precipitation: number, humidity: number, windSpeed: number): {
  level: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme'
  description: string
  factors: {
    precipitationRisk: number
    humidityContribution: number
    windImpact: number
    overallScore: number
  }
  recommendations: string[]
} {
  // Calculate individual risk factors (0-100 scale)
  const precipitationRisk = Math.min(100, precipitation * 1.2) // Precipitation has highest weight
  const humidityContribution = humidity > 80 ? (humidity - 80) * 2 : 0 // High humidity increases wet feeling
  const windImpact = windSpeed > 20 ? (windSpeed - 20) * 1.5 : 0 // Wind can make rain more intense
  
  // Calculate overall risk score
  const overallScore = (precipitationRisk * 0.6) + (humidityContribution * 0.25) + (windImpact * 0.15)
  
  // Determine risk level
  let level: 'Very Low' | 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme'
  let description: string
  let recommendations: string[]
  
  if (overallScore >= 90) {
    level = 'Extreme'
    description = 'Dangerously wet conditions with high risk of flooding and severe weather impacts.'
    recommendations = [
      'Cancel all outdoor activities immediately',
      'Seek indoor shelter with flood protection',
      'Monitor emergency weather alerts',
      'Prepare for potential evacuation',
      'Avoid all travel if possible'
    ]
  } else if (overallScore >= 70) {
    level = 'Very High'
    description = 'Severe wet conditions likely to cause significant disruption and safety hazards.'
    recommendations = [
      'Strongly recommend postponing outdoor events',
      'Waterproof shelter essential for any outdoor activity',
      'Have emergency backup plans ready',
      'Monitor weather updates frequently',
      'Avoid low-lying areas prone to flooding'
    ]
  } else if (overallScore >= 50) {
    level = 'High'
    description = 'Heavy precipitation expected with high likelihood of event disruption.'
    recommendations = [
      'Consider moving activities indoors',
      'Comprehensive rain protection required',
      'Prepare contingency plans',
      'Check venue drainage capabilities',
      'Advise attendees to bring waterproof gear'
    ]
  } else if (overallScore >= 30) {
    level = 'Moderate'
    description = 'Moderate wet conditions that may affect comfort and some activities.'
    recommendations = [
      'Light rain protection recommended',
      'Covered areas advisable',
      'Monitor weather trends',
      'Have indoor backup options available',
      'Consider rescheduling sensitive activities'
    ]
  } else if (overallScore >= 15) {
    level = 'Low'
    description = 'Minor precipitation expected, minimal impact on most activities.'
    recommendations = [
      'Umbrella or light rain gear sufficient',
      'Most outdoor activities can proceed',
      'Keep weather monitoring',
      'Prepare for possible light showers',
      'Consider covered areas for comfort'
    ]
  } else {
    level = 'Very Low'
    description = 'Negligible precipitation expected, ideal conditions for outdoor activities.'
    recommendations = [
      'Perfect weather for outdoor events',
      'No special weather precautions needed',
      'Enjoy optimal outdoor conditions',
      'Standard event planning applies',
      'Monitor for any sudden changes'
    ]
  }
  
  return {
    level,
    description,
    factors: {
      precipitationRisk: Math.round(precipitationRisk),
      humidityContribution: Math.round(humidityContribution),
      windImpact: Math.round(windImpact),
      overallScore: Math.round(overallScore)
    },
    recommendations
  }
}

function generateHistoricalWeatherData(request: any) {
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Thunderstorm']
  const data = []
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    
    // Generate realistic weather patterns with some trends
    const baseTemp = 20 + Math.sin(i / 7) * 10 // Weekly temperature cycle
    const seasonalTrend = Math.sin(i / 30) * 5 // Monthly trend
    
    data.push({
      date: date.toISOString().split('T')[0],
      temperature: Math.round(baseTemp + seasonalTrend + (Math.random() - 0.5) * 10),
      precipitation: Math.max(0, Math.round(30 + Math.sin(i / 5) * 20 + (Math.random() - 0.5) * 40)),
      humidity: Math.round(50 + Math.random() * 30),
      windSpeed: Math.round(5 + Math.random() * 15),
      conditions: conditions[Math.floor(Math.random() * conditions.length)]
    })
  }
  
  return data
}

function analyzeTrends(data: any[]) {
  // Calculate temperature trend
  const recentTemps = data.slice(-7).map(d => d.temperature)
  const earlierTemps = data.slice(-14, -7).map(d => d.temperature)
  const avgRecentTemp = recentTemps.reduce((a, b) => a + b, 0) / recentTemps.length
  const avgEarlierTemp = earlierTemps.reduce((a, b) => a + b, 0) / earlierTemps.length
  
  const temperatureTrend = avgRecentTemp > avgEarlierTemp + 2 ? 'rising' : 
                          avgRecentTemp < avgEarlierTemp - 2 ? 'falling' : 'stable'
  
  // Calculate precipitation trend
  const recentPrecip = data.slice(-7).map(d => d.precipitation)
  const earlierPrecip = data.slice(-14, -7).map(d => d.precipitation)
  const avgRecentPrecip = recentPrecip.reduce((a, b) => a + b, 0) / recentPrecip.length
  const avgEarlierPrecip = earlierPrecip.reduce((a, b) => a + b, 0) / earlierPrecip.length
  
  const precipitationTrend = avgRecentPrecip > avgEarlierPrecip + 10 ? 'increasing' : 
                             avgRecentPrecip < avgEarlierPrecip - 10 ? 'decreasing' : 'stable'
  
  // Calculate averages
  const averageTemperature = Math.round(data.reduce((sum, d) => sum + d.temperature, 0) / data.length)
  const averagePrecipitation = Math.round(data.reduce((sum, d) => sum + d.precipitation, 0) / data.length)
  
  // Count extreme weather days
  const extremeWeatherDays = data.filter(d => 
    d.temperature > 30 || d.temperature < 5 || d.precipitation > 70 || d.windSpeed > 20
  ).length
  
  // Find most common condition
  const conditionCounts = data.reduce((acc, d) => {
    acc[d.conditions] = (acc[d.conditions] || 0) + 1
    return acc
  }, {} as { [key: string]: number })
  
  const mostCommonCondition = Object.entries(conditionCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown'
  
  // Analyze weekly patterns
  const weeklyPatterns: { [key: string]: any } = {}
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  
  dayNames.forEach(day => {
    const dayData = data.filter(d => new Date(d.date).getDay() === dayNames.indexOf(day))
    if (dayData.length > 0) {
      const avgTemp = dayData.reduce((sum, d) => sum + d.temperature, 0) / dayData.length
      const avgPrecip = dayData.reduce((sum, d) => sum + d.precipitation, 0) / dayData.length
      
      const conditionFrequency = dayData.reduce((acc, d) => {
        acc[d.conditions] = (acc[d.conditions] || 0) + 1
        return acc
      }, {} as { [key: string]: number })
      
      weeklyPatterns[day] = {
        avgTemp: Math.round(avgTemp),
        avgPrecipitation: Math.round(avgPrecip),
        conditionFrequency
      }
    }
  })
  
  return {
    temperatureTrend,
    precipitationTrend,
    averageTemperature,
    averagePrecipitation,
    extremeWeatherDays,
    mostCommonCondition,
    weeklyPatterns
  }
}

function generateAdvancedWeatherAnalysis(request: WeatherRequest) {
  const baseData = generateMockWeatherData(request)
  
  // Generate historical data and trends
  const historicalData = generateHistoricalWeatherData({
    latitude: request.latitude,
    longitude: request.longitude,
    days: 30
  })
  
  const trendAnalysis = analyzeTrends(historicalData)
  
  // Advanced wet conditions analysis
  const wetConditionsRisk = calculateWetConditionsRisk(
    baseData.precipitation,
    baseData.humidity,
    baseData.windSpeed
  )
  
  // Event-specific impact analysis
  const eventImpactAnalysis = {
    parade: {
      risk: wetConditionsRisk.level,
      impact: baseData.precipitation > 30 ? 'High - Floats and participants at risk' : 'Low - Suitable conditions',
      considerations: [
        'Float stability concerns in high wind',
        'Participant safety on wet surfaces',
        'Spectator comfort in rain',
        'Route drainage assessment needed',
        'Emergency vehicle access in poor conditions'
      ]
    },
    concert: {
      risk: wetConditionsRisk.level,
      impact: baseData.precipitation > 40 ? 'High - Equipment damage risk' : 'Low - Good conditions',
      considerations: [
        'Electrical equipment safety concerns',
        'Stage slip hazards',
        'Sound equipment water damage',
        'Artist and crew safety',
        'Audience experience degradation'
      ]
    },
    sports: {
      risk: wetConditionsRisk.level,
      impact: baseData.precipitation > 25 ? 'High - Player safety issues' : 'Low - Playable conditions',
      considerations: [
        'Field/play surface safety',
        'Player injury risk increase',
        'Ball handling difficulties',
        'Spectator viewing experience',
        'Match postponement likelihood'
      ]
    },
    wedding: {
      risk: wetConditionsRisk.level,
      impact: baseData.precipitation > 20 ? 'High - Ceremony disruption' : 'Low - Beautiful conditions',
      considerations: [
        'Ceremony location viability',
        'Photography conditions',
        'Guest comfort and experience',
        'Venue accessibility',
        'Alternative indoor options'
      ]
    },
    outdoor: {
      risk: wetConditionsRisk.level,
      impact: baseData.precipitation > 35 ? 'High - General disruption' : 'Low - Suitable for activities',
      considerations: [
        'General activity feasibility',
        'Attendee comfort levels',
        'Equipment and setup protection',
        'Venue accessibility',
        'Overall event success probability'
      ]
    }
  }
  
  return {
    ...baseData,
    historicalData,
    trendAnalysis,
    advancedAnalysis: {
      wetConditionsRisk,
      eventImpactAnalysis,
      severeWeatherProbability: {
        thunderstorm: baseData.precipitation > 60 && baseData.windSpeed > 15 ? 'High' : 'Low',
        flooding: baseData.precipitation > 80 ? 'High' : baseData.precipitation > 50 ? 'Moderate' : 'Low',
        windDamage: baseData.windSpeed > 25 ? 'High' : baseData.windSpeed > 15 ? 'Moderate' : 'Low'
      },
      microclimateFactors: {
        urbanHeatIsland: request.eventType === 'outdoor' ? 'Moderate' : 'Low',
        elevationEffect: 'Minimal',
        coastalInfluence: baseData.humidity > 70 ? 'Moderate' : 'Low',
        topographicShelter: 'Variable - location dependent'
      }
    }
  }
}

function generateMockWeatherData(request: WeatherRequest): WeatherData {
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Thunderstorm']
  const riskLevels: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High']
  
  // Generate base weather data
  const temperature = Math.floor(Math.random() * 30) + 10
  const humidity = Math.floor(Math.random() * 60) + 40
  const windSpeed = Math.floor(Math.random() * 20) + 5
  const precipitation = Math.floor(Math.random() * 100)
  const conditionsIndex = Math.floor(Math.random() * conditions.length)
  
  // Calculate risk level based on conditions
  let riskLevel: 'Low' | 'Medium' | 'High' = 'Low'
  if (precipitation > 70 || windSpeed > 15 || conditionsIndex >= 3) {
    riskLevel = 'High'
  } else if (precipitation > 40 || windSpeed > 10 || conditionsIndex >= 2) {
    riskLevel = 'Medium'
  }
  
  // Generate hourly forecast
  const hourlyForecast = Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    temperature: temperature + Math.floor(Math.random() * 10) - 5,
    precipitation: Math.max(0, precipitation + Math.floor(Math.random() * 40) - 20),
    conditions: conditions[Math.floor(Math.random() * conditions.length)]
  }))
  
  // Generate recommendations based on conditions
  const recommendations = {
    weatherAdvisory: precipitation > 50 
      ? 'High chance of precipitation. Consider indoor venue or weather protection.'
      : 'Generally favorable conditions expected.',
    optimalTiming: precipitation > 50
      ? 'Best window: 14:00-17:00 for lower precipitation probability.'
      : 'All day suitable for outdoor activities.',
    backupPlans: precipitation > 30
      ? 'Prepare covered areas and have indoor alternatives ready.'
      : 'Standard contingency plans recommended.'
  }
  
  // Generate risk analysis
  const riskAnalysis = {
    precipitationRisk: {
      level: precipitation > 70 ? 'Very High' : precipitation > 40 ? 'High' : precipitation > 20 ? 'Moderate' : 'Low',
      description: precipitation > 50 
        ? 'High probability of rain affecting outdoor activities.'
        : 'Minimal precipitation expected.'
    },
    windImpact: {
      level: windSpeed > 15 ? 'High' : windSpeed > 10 ? 'Moderate' : 'Low',
      description: windSpeed > 15
        ? 'Strong winds may affect lightweight structures and comfort.'
        : 'Wind conditions should not significantly impact activities.'
    },
    temperatureComfort: {
      level: temperature < 15 ? 'Cool' : temperature > 25 ? 'Warm' : 'Comfortable',
      description: temperature < 15
        ? 'Cool temperatures may require additional clothing or heating.'
        : temperature > 25
        ? 'Warm conditions, ensure adequate hydration and shade.'
        : 'Comfortable temperature range for most activities.'
    }
  }
  
  return {
    location: `${request.latitude.toFixed(4)}, ${request.longitude.toFixed(4)}`,
    date: request.date,
    temperature,
    humidity,
    windSpeed,
    precipitation,
    conditions: conditions[conditionsIndex],
    riskLevel,
    hourlyForecast,
    recommendations,
    riskAnalysis
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: WeatherRequest = await request.json()
    
    if (!body.latitude || !body.longitude || !body.date) {
      return NextResponse.json(
        { error: 'Latitude, longitude, and date are required' },
        { status: 400 }
      )
    }
    
    // Generate advanced weather analysis
    const weatherData = generateAdvancedWeatherAnalysis(body)
    
    return NextResponse.json(weatherData)
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}