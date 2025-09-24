import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = 'demo-user-id'
    
    const alerts = await db.weatherAlert.findMany({
      where: { 
        userId,
        isActive: true 
      },
      include: {
        location: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('Error fetching user alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user alerts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = 'demo-user-id'
    const body = await request.json()

    const alert = await db.weatherAlert.create({
      data: {
        userId,
        locationId: body.locationId,
        title: body.title,
        description: body.description,
        alertType: body.alertType,
        severity: body.severity,
        minPrecipitation: body.minPrecipitation,
        maxPrecipitation: body.maxPrecipitation,
        minTemperature: body.minTemperature,
        maxTemperature: body.maxTemperature,
        maxWindSpeed: body.maxWindSpeed,
        weatherConditions: body.weatherConditions ? JSON.stringify(body.weatherConditions) : null,
        eventDate: body.eventDate ? new Date(body.eventDate) : null,
        isActive: body.isActive ?? true
      }
    })

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Error creating weather alert:', error)
    return NextResponse.json(
      { error: 'Failed to create weather alert' },
      { status: 500 }
    )
  }
}