import { NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Build query parameters from the body
    const params = new URLSearchParams()
    if (body.bootcamp_id) params.append('bootcamp_id', body.bootcamp_id.toString())
    if (body.start) params.append('start', body.start)
    if (body.end) params.append('end', body.end)
    if (body.granularity) params.append('granularity', body.granularity)
    
    const queryString = params.toString()
    const url = `${FASTAPI_URL}/dashboard${queryString ? '?' + queryString : ''}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': request.headers.get('x-user-id') || '1',
        'x-user-role': request.headers.get('x-user-role') || 'admin',
      },
    })

    if (!response.ok) {
      throw new Error(`FastAPI responded with status ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
