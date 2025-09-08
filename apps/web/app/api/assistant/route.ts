import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversation_history, rag_system } = body;

    // No authentication required - removed for RAG testing

    // Prepare the request for your FastAPI backend
    const apiRequest = {
      query: message,
      rag_system: rag_system || 'vector', // Default to vector if not specified
      session_id: null, // You can implement session management later
      bootcamp_id: null, // You can get this from user context if needed
    };

    // Forward to your FastAPI backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/assistant/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequest),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Return in the format expected by your frontend
    return NextResponse.json({
      response: data.answer,
      sources: data.sources || [],
      session_id: data.session_id,
    });

  } catch (error) {
    console.error('Assistant API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        response: 'I apologize, but I encountered an error processing your request. Please try again later.',
        sources: []
      },
      { status: 500 }
    );
  }
}
