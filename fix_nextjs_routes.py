#!/usr/bin/env python3
"""
Script to fix all Next.js API routes to use the correct FastAPI endpoints
"""
import os

# Routes to fix with their corresponding FastAPI endpoints
routes = [
    ('attention-chart', 'attention-chart'),
    ('leaderboard', 'leaderboard'),
    ('attendance-heatmap', 'attendance-heatmap')
]

# Base directory for Next.js API routes
base_dir = r'C:\Users\rssh1\Desktop\ClassSight\apps\web\app\api\dashboard'

# Template for the fixed route
template = '''import { NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Use the correct FastAPI endpoint for {route_name}
    const url = `${{FASTAPI_URL}}/dashboard/{fastapi_endpoint}`
    
    const response = await fetch(url, {{
      method: 'POST',  // Changed to POST
      headers: {{
        'Content-Type': 'application/json',
        'x-user-id': request.headers.get('x-user-id') || '1',
        'x-user-role': request.headers.get('x-user-role') || 'admin',
      }},
      body: JSON.stringify(body.bootcamp_ids || [])  // Send bootcamp_ids as array
    }})

    if (!response.ok) {{
      throw new Error(`FastAPI responded with status ${{response.status}}`)
    }}

    const data = await response.json()
    // Return the {route_name} data directly
    return NextResponse.json(data)
  }} catch (error) {{
    console.error('{route_name} API error:', error)
    return NextResponse.json(
      {{ error: 'Failed to fetch {route_name} data' }},
      {{ status: 500 }}
    )
  }}
}}
'''

for route_name, fastapi_endpoint in routes:
    route_path = os.path.join(base_dir, route_name, 'route.ts')
    
    if os.path.exists(route_path):
        content = template.format(
            route_name=route_name.replace('-', ' ').title(),
            fastapi_endpoint=fastapi_endpoint
        )
        
        with open(route_path, 'w') as f:
            f.write(content)
        
        print(f"✅ Fixed {route_path}")
    else:
        print(f"❌ Route not found: {route_path}")

print("\n🎉 All routes fixed!")
