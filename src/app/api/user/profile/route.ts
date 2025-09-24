import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // For demo purposes, we'll use a hardcoded user ID
    // In a real app, this would come from authentication
    const userId = 'demo-user-id'
    
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        locations: {
          orderBy: { isDefault: 'desc' }
        },
        alerts: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user) {
      // Create demo user if not exists
      const newUser = await db.user.create({
        data: {
          id: userId,
          email: 'demo@example.com',
          name: 'Demo User',
          profile: {
            create: {
              preferredUnits: 'metric',
              theme: 'auto',
              language: 'en',
              timezone: 'UTC',
              emailNotifications: true,
              pushNotifications: false,
              alertThreshold: 50
            }
          }
        },
        include: {
          profile: true,
          locations: true,
          alerts: true
        }
      })
      
      return NextResponse.json(newUser)
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = 'demo-user-id'
    const body = await request.json()

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        name: body.name,
        profile: {
          upsert: {
            create: {
              preferredUnits: body.preferredUnits || 'metric',
              theme: body.theme || 'auto',
              language: body.language || 'en',
              timezone: body.timezone || 'UTC',
              emailNotifications: body.emailNotifications ?? true,
              pushNotifications: body.pushNotifications ?? false,
              alertThreshold: body.alertThreshold || 50
            },
            update: {
              preferredUnits: body.preferredUnits,
              theme: body.theme,
              language: body.language,
              timezone: body.timezone,
              emailNotifications: body.emailNotifications,
              pushNotifications: body.pushNotifications,
              alertThreshold: body.alertThreshold
            }
          }
        }
      },
      include: {
        profile: true,
        locations: true,
        alerts: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    )
  }
}