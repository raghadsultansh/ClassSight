import { NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

export async function GET() {
  try {
    console.log('Health check: Testing connection to FastAPI at:', FASTAPI_URL)
    
    // Test connection to FastAPI
    const response = await fetch(`${FASTAPI_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    console.log('Health check: FastAPI response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Health check: FastAPI error:', errorText)
      return NextResponse.json(
        { 
          status: 'error', 
          message: `FastAPI not responding: ${response.status}`,
          fastapi_url: FASTAPI_URL,
          error: errorText
        },
        { status: 503 }
      )
    }

    const data = await response.json()
    console.log('Health check: FastAPI health response:', data)
    
    return NextResponse.json({
      status: 'ok',
      message: 'Next.js API can connect to FastAPI',
      fastapi_url: FASTAPI_URL,
      fastapi_health: data
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Cannot connect to FastAPI',
        fastapi_url: FASTAPI_URL,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}
