import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bootcampId = searchParams.get('bootcampId')
    const timeGranularity = searchParams.get('timeGranularity')
    
    let url = `${FASTAPI_URL}/dashboard/heatmap-data`
    const params = new URLSearchParams()
    if (bootcampId) params.append('bootcampId', bootcampId)
    if (timeGranularity) params.append('timeGranularity', timeGranularity)
    
    if (params.toString()) {
      url += `?${params.toString()}`
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': request.headers.get('x-user-id') || '',
        'x-user-role': request.headers.get('x-user-role') || '',
      },
    })

    if (!response.ok) {
      console.error('FastAPI responded with status', response.status)
      throw new Error(`FastAPI responded with status ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Heatmap data API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch heatmap data' }, 
      { status: 500 }
    )
  }
}
