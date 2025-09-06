import { NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const response = await fetch(`${FASTAPI_URL}/dashboard/kpis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': request.headers.get('x-user-id') || '1',
        'x-user-role': request.headers.get('x-user-role') || 'admin',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`FastAPI responded with status ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('KPIs API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch KPI data' },
      { status: 500 }
    )
  }
}
