import { NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

// Helper function to sanitize request body
function sanitizeRequestBody(rawBody: any) {
  return {
    ...rawBody,
    bootcamp_ids: Array.isArray(rawBody.bootcamp_ids) 
      ? rawBody.bootcamp_ids.filter(id => id !== null && id !== undefined && !isNaN(Number(id))).map(id => Number(id))
      : rawBody.bootcamp_ids,
    instructor_ids: Array.isArray(rawBody.instructor_ids)
      ? rawBody.instructor_ids.filter(id => id !== null && id !== undefined && id !== '')
      : rawBody.instructor_ids
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json()
    const body = sanitizeRequestBody(rawBody)
    
    const response = await fetch(`${FASTAPI_URL}/dashboard/grade-performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': request.headers.get('x-user-id') || '1',
        'x-user-role': request.headers.get('x-user-role') || 'admin',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('FastAPI grade-performance error:', response.status, errorText)
      throw new Error(`FastAPI responded with status ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Dashboard grade-performance API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grade performance data' }, 
      { status: 500 }
    )
  }
}
