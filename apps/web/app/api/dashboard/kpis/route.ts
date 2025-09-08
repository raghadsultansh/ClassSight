import { NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const rawBody = await request.json()
    
    // Sanitize the request body to prevent null values in arrays
    const body = {
      ...rawBody,
      bootcamp_ids: Array.isArray(rawBody.bootcamp_ids) 
        ? rawBody.bootcamp_ids.filter(id => id !== null && id !== undefined && !isNaN(Number(id))).map(id => Number(id))
        : rawBody.bootcamp_ids,
      instructor_ids: Array.isArray(rawBody.instructor_ids)
        ? rawBody.instructor_ids.filter(id => id !== null && id !== undefined && id !== '')
        : rawBody.instructor_ids
    }
    
    // Use the correct FastAPI endpoint for KPIs
    const url = `${FASTAPI_URL}/dashboard/kpis`
    
    // Debug logging for browser requests
    console.log('=== KPIs API Request ===')
    console.log('Raw Body:', JSON.stringify(rawBody, null, 2))
    console.log('Sanitized Body:', JSON.stringify(body, null, 2))
    console.log('Headers:', {
      'x-user-id': request.headers.get('x-user-id') || '1',
      'x-user-role': request.headers.get('x-user-role') || 'admin',
    })
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': request.headers.get('x-user-id') || '1',
        'x-user-role': request.headers.get('x-user-role') || 'admin',
      },
      body: JSON.stringify(body)  // Send the full filters object
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('KPIs API: FastAPI error response:', errorText)
      throw new Error(`FastAPI responded with status ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    // Return the KPI data directly
    return NextResponse.json(data)
  } catch (error) {
    console.error('KPIs API error:', error)
    console.error('Request URL:', `${FASTAPI_URL}/dashboard/kpis`)
    console.error('Request headers:', {
      'x-user-id': request.headers.get('x-user-id') || '1',
      'x-user-role': request.headers.get('x-user-role') || 'admin',
    })
    return NextResponse.json(
      { error: 'Failed to fetch KPI data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
