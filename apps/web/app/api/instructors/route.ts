import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${FASTAPI_URL}/admin/instructors`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': request.headers.get('x-user-id') || '1',
        'x-user-role': request.headers.get('x-user-role') || 'admin',
      },
    })

    if (!response.ok) {
      console.error('FastAPI responded with status', response.status)
      throw new Error(`FastAPI responded with status ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Instructors API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instructors' }, 
      { status: 500 }
    )
  }
}
