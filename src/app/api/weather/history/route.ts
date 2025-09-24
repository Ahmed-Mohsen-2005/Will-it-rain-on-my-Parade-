import { NextRequest, NextResponse } from 'next/server'

interface HistoryRequest {
  latitude: number
  longitude: number
  days: number
}

interface HistoricalData {
  date: string
  temperature: number
  precipitation: number
  humidity: number
  windSpeed: number
  conditions: string
}

interface TrendAnalysis {
  temperatureTrend: 'rising' | 'falling' | 'stable'
  precipitationTrend: 'increasing' | 'decreasing' | 'stable'
  averageTemperature: number
  averagePrecipitation: number
  extremeWeatherDays: number
  mostCommonCondition: string
  weeklyPatterns: {
    [key: string]: {
      avgTemp: number
      avgPrecipitation: number
      conditionFrequency: { [key: string]: number }
    }
  }
}

function generateHistoricalWeatherData(request: HistoryRequest): HistoricalData[] {
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Thunderstorm']
  const data: HistoricalData[] = []
  
  for (let i = request.days; i >= 0; i--) {
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

function analyzeTrends(data: HistoricalData[]): TrendAnalysis {
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

export async function POST(request: NextRequest) {
  try {
    const body: HistoryRequest = await request.json()
    
    if (!body.latitude || !body.longitude || !body.days) {
      return NextResponse.json(
        { error: 'Latitude, longitude, and days are required' },
        { status: 400 }
      )
    }
    
    if (body.days > 365) {
      return NextResponse.json(
        { error: 'Maximum 365 days of historical data allowed' },
        { status: 400 }
      )
    }
    
    // Generate historical weather data
    const historicalData = generateHistoricalWeatherData(body)
    
    // Analyze trends
    const trendAnalysis = analyzeTrends(historicalData)
    
    return NextResponse.json({
      historicalData,
      trendAnalysis,
      location: `${body.latitude.toFixed(4)}, ${body.longitude.toFixed(4)}`,
      period: `${body.days} days`
    })
  } catch (error) {
    console.error('Weather history API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather history data' },
      { status: 500 }
    )
  }
}