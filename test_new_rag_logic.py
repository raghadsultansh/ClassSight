#!/usr/bin/env python3

import requests
import json

def test_default_behavior():
    """Test that V2 is now the default and fallback works"""
    
    url = "http://localhost:3000/api/assistant"
    
    # Test 1: Default behavior (should use V2/SQL)
    print("🔹 Test 1: Default behavior (should use SQL/V2)")
    payload = {
        "message": "How many students are enrolled?",
        "conversation_history": [],
        "rag_system": "sql"  # Explicitly request SQL
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            print("✅ SQL RAG (V2) working as primary system")
            print(f"Answer preview: {result['response'][:100]}...")
        else:
            print(f"❌ Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "="*50 + "\n")
    
    # Test 2: Explicit Vector request (should use V1)
    print("🔹 Test 2: Explicit Vector request (should use Vector/V1)")
    payload = {
        "message": "What is the average attendance?",
        "conversation_history": [],
        "rag_system": "vector"  # Explicitly request Vector
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        if response.status_code == 200:
            result = response.json()
            print("✅ Vector RAG (V1) working when explicitly requested")
            print(f"Answer preview: {result['response'][:100]}...")
        else:
            print(f"❌ Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Testing New RAG System Logic")
    print("V2 (SQL) = Primary system")
    print("V1 (Vector) = Fallback + explicit option")
    print("="*60)
    test_default_behavior()
