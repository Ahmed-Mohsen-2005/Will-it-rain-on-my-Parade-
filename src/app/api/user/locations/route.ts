import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = 'demo-user-id'
    
    const locations = await db.userLocation.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' }
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching user locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user locations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = 'demo-user-id'
    const body = await request.json()

    // If this is set as default, unset other defaults
    if (body.isDefault) {
      await db.userLocation.updateMany({
        where: { userId },
        data: { isDefault: false }
      })
    }

    const location = await db.userLocation.create({
      data: {
        userId,
        name: body.name,
        address: body.address,
        latitude: body.latitude,
        longitude: body.longitude,
        city: body.city,
        state: body.state,
        country: body.country,
        countryCode: body.countryCode,
        isDefault: body.isDefault || false,
        nickname: body.nickname
      }
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error creating user location:', error)
    return NextResponse.json(
      { error: 'Failed to create user location' },
      { status: 500 }
    )
  }
}