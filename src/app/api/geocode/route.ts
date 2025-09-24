import { NextRequest, NextResponse } from 'next/server'

interface GeocodeResult {
  place_id: number
  licence: string
  osm_type: string
  osm_id: number
  lat: string
  lon: string
  display_name: string
  address: {
    house_number?: string
    road?: string
    suburb?: string
    city?: string
    county?: string
    state?: string
    postcode?: string
    country?: string
    country_code?: string
  }
  boundingbox: [string, string, string, string]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  try {
    // Using Nominatim OpenStreetMap geocoding service
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'User-Agent': 'NASA-Space-Apps-Weather-App/1.0'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch geocoding data')
    }

    const data: GeocodeResult[] = await response.json()
    
    // Transform the data to a cleaner format
    const locations = data.map(item => ({
      id: item.place_id,
      name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      address: {
        city: item.address.city || item.address.town || item.address.village || '',
        state: item.address.state || '',
        country: item.address.country || '',
        countryCode: item.address.country_code || ''
      }
    }))

    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Failed to geocode location' },
      { status: 500 }
    )
  }
}