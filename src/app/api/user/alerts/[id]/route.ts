import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = 'demo-user-id'
    const alertId = params.id

    // Verify the alert belongs to the user
    const alert = await db.weatherAlert.findFirst({
      where: { 
        id: alertId,
        userId 
      }
    })

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    await db.weatherAlert.delete({
      where: { id: alertId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting weather alert:', error)
    return NextResponse.json(
      { error: 'Failed to delete weather alert' },
      { status: 500 }
    )
  }
}