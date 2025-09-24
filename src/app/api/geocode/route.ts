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
    // Using Nominatim OpenStreetMap geocoding service with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'User-Agent': 'NASA-Space-Apps-Weather-App/1.0'
        },
        signal: controller.signal
      }
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error('Failed to fetch geocoding data')
    }

    const data: GeocodeResult[] = await response.json()
    
    // Transform the data to a cleaner format with better error handling
    const locations = data.map(item => ({
      id: item.place_id,
      name: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      address: {
        city: item.address?.city || item.address?.town || item.address?.village || 'Unknown',
        state: item.address?.state || '',
        country: item.address?.country || 'Unknown',
        countryCode: item.address?.country_code || ''
      }
    })).filter(item => item && !isNaN(item.latitude) && !isNaN(item.longitude))

    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Geocoding error:', error)
    
    // Fallback mock data for common cities when API fails
    const mockLocations = [
      {
        id: 1,
        name: "New York, NY, USA",
        latitude: 40.7128,
        longitude: -74.0060,
        address: {
          city: "New York",
          state: "New York",
          country: "United States",
          countryCode: "US"
        }
      },
      {
        id: 2,
        name: "London, England, United Kingdom",
        latitude: 51.5074,
        longitude: -0.1278,
        address: {
          city: "London",
          state: "England",
          country: "United Kingdom",
          countryCode: "GB"
        }
      },
      {
        id: 3,
        name: "Tokyo, Japan",
        latitude: 35.6762,
        longitude: 139.6503,
        address: {
          city: "Tokyo",
          state: "",
          country: "Japan",
          countryCode: "JP"
        }
      },
      {
        id: 4,
        name: "Paris, France",
        latitude: 48.8566,
        longitude: 2.3522,
        address: {
          city: "Paris",
          state: "",
          country: "France",
          countryCode: "FR"
        }
      },
      {
        id: 5,
        name: "Sydney, NSW, Australia",
        latitude: -33.8688,
        longitude: 151.2093,
        address: {
          city: "Sydney",
          state: "New South Wales",
          country: "Australia",
          countryCode: "AU"
        }
      }
    ]

    // Filter mock locations based on query
    const filteredLocations = mockLocations.filter(location => 
      location.name.toLowerCase().includes(query.toLowerCase()) ||
      location.address.city.toLowerCase().includes(query.toLowerCase())
    )

    return NextResponse.json({ locations: filteredLocations })
  }
}