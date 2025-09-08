#!/usr/bin/env python3

import sys
import os
sys.path.append(r"c:\Users\rssh1\Desktop\ClassSight\apps\api")

from utils.vector_rag import rag_answer

def test_vector_rag_queries():
    """Test the actual Vector RAG responses"""
    
    queries = [
        "How many students are enrolled?",
        "How many students are in total?",
        "What is the total number of students?",
        "List all students enrolled in bootcamps"
    ]
    
    print("🧪 Testing Vector RAG Responses:")
    print("="*60)
    
    for i, query in enumerate(queries, 1):
        print(f"\n--- Query {i}: {query} ---")
        try:
            result = rag_answer(query)
            print(f"Answer: {result['answer']}")
            print(f"Sources: {len(result.get('sources', []))} sources found")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_vector_rag_queries()
