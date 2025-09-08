import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const include_completed = searchParams.get('include_completed') || 'false'
    
    // Forward headers from the request
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    // Get auth headers with defaults
    const userId = request.headers.get('x-user-id') || '1'
    const userRole = request.headers.get('x-user-role') || 'admin'
    
    headers['x-user-id'] = userId
    headers['x-user-role'] = userRole

    const response = await fetch(
      `${FASTAPI_URL}/dashboard/bootcamps?include_completed=${include_completed}`,
      {
        method: 'GET',
        headers,
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: `FastAPI error: ${errorText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Bootcamps API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
