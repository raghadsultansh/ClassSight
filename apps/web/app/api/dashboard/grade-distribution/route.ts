import { NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Use the correct FastAPI endpoint for grade distribution
    const url = `${FASTAPI_URL}/dashboard/grade-distribution`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': request.headers.get('x-user-id') || '1',
        'x-user-role': request.headers.get('x-user-role') || 'admin',
      },
      body: JSON.stringify(body.bootcamp_ids || [])
    })

    if (!response.ok) {
      // Return empty grade distribution if grades endpoint fails
      return NextResponse.json({ 
        distribution: [],
        stats: { avg: 0, min: 0, max: 0, count: 0 }
      })
    }

    const data = await response.json()
    return NextResponse.json({ 
      distribution: data.items || [],
      stats: data.stats || { avg: 0, min: 0, max: 0, count: 0 }
    })
  } catch (error) {
    console.error('Grade Distribution API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grade distribution data' },
      { status: 500 }
    )
  }
}
