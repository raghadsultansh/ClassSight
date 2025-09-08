#!/usr/bin/env python3
"""
Test script to check API endpoints and identify issues
"""
import asyncio
import httpx
import json
from datetime import datetime

# API configuration
FASTAPI_BASE = "http://127.0.0.1:8000"
NEXTJS_BASE = "http://localhost:3000/api"

async def test_fastapi_endpoints():
    """Test FastAPI endpoints directly"""
    print("🔍 Testing FastAPI endpoints...")
    
    headers = {
        "Content-Type": "application/json",
        "x-user-id": "1",
        "x-user-role": "admin"
    }
    
    endpoints_to_test = [
        {"method": "GET", "url": f"{FASTAPI_BASE}/"},
        {"method": "GET", "url": f"{FASTAPI_BASE}/health"},
        {"method": "POST", "url": f"{FASTAPI_BASE}/dashboard/kpis", "json": []},
        {"method": "POST", "url": f"{FASTAPI_BASE}/dashboard/attendance-chart", "json": []},
        {"method": "POST", "url": f"{FASTAPI_BASE}/dashboard/attention-chart", "json": []},
        {"method": "POST", "url": f"{FASTAPI_BASE}/dashboard/grade-distribution", "json": []},
        {"method": "POST", "url": f"{FASTAPI_BASE}/dashboard/leaderboard", "json": []},
        {"method": "POST", "url": f"{FASTAPI_BASE}/dashboard/attendance-heatmap", "json": []},
        {"method": "GET", "url": f"{FASTAPI_BASE}/dashboard"},
    ]
    
    async with httpx.AsyncClient() as client:
        for endpoint in endpoints_to_test:
            try:
                if endpoint["method"] == "GET":
                    response = await client.get(endpoint["url"], headers=headers)
                else:
                    response = await client.post(
                        endpoint["url"], 
                        headers=headers, 
                        json=endpoint.get("json", {})
                    )
                
                status = "✅" if response.status_code == 200 else "❌"
                print(f"{status} {endpoint['method']} {endpoint['url']} - Status: {response.status_code}")
                
                if response.status_code != 200:
                    print(f"   Error: {response.text}")
                else:
                    # Print response summary for successful requests
                    try:
                        data = response.json()
                        if isinstance(data, dict):
                            print(f"   Response keys: {list(data.keys())}")
                        elif isinstance(data, list):
                            print(f"   Response: list with {len(data)} items")
                    except:
                        print(f"   Response: {response.text[:100]}...")
                        
            except Exception as e:
                print(f"❌ {endpoint['method']} {endpoint['url']} - Error: {str(e)}")
                
            print()

async def test_nextjs_endpoints():
    """Test Next.js API routes"""
    print("🔍 Testing Next.js API endpoints...")
    
    headers = {
        "Content-Type": "application/json",
        "x-user-id": "1",
        "x-user-role": "admin"
    }
    
    endpoints_to_test = [
        {"url": f"{NEXTJS_BASE}/dashboard/kpis"},
        {"url": f"{NEXTJS_BASE}/dashboard/attendance-chart"},
        {"url": f"{NEXTJS_BASE}/dashboard/attention-chart"},
        {"url": f"{NEXTJS_BASE}/dashboard/grade-distribution"},
        {"url": f"{NEXTJS_BASE}/dashboard/leaderboard"},
        {"url": f"{NEXTJS_BASE}/dashboard/attendance-heatmap"},
    ]
    
    test_payload = {
        "bootcamp_ids": [],
        "granularity": "daily",
        "include_completed": False
    }
    
    async with httpx.AsyncClient() as client:
        for endpoint in endpoints_to_test:
            try:
                response = await client.post(
                    endpoint["url"], 
                    headers=headers, 
                    json=test_payload
                )
                
                status = "✅" if response.status_code == 200 else "❌"
                print(f"{status} POST {endpoint['url']} - Status: {response.status_code}")
                
                if response.status_code != 200:
                    print(f"   Error: {response.text}")
                else:
                    try:
                        data = response.json()
                        if isinstance(data, dict):
                            print(f"   Response keys: {list(data.keys())}")
                        elif isinstance(data, list):
                            print(f"   Response: list with {len(data)} items")
                    except:
                        print(f"   Response: {response.text[:100]}...")
                        
            except Exception as e:
                print(f"❌ POST {endpoint['url']} - Error: {str(e)}")
                
            print()

async def main():
    print(f"🚀 Starting API endpoint tests at {datetime.now()}\n")
    
    await test_fastapi_endpoints()
    print("-" * 50)
    await test_nextjs_endpoints()
    
    print("✨ Test completed!")

if __name__ == "__main__":
    asyncio.run(main())
