#!/usr/bin/env python3

import sys
import os
sys.path.append(r"c:\Users\rssh1\Desktop\ClassSight\apps\api")

from utils.vector_rag import get_top_k_chunks, RAG_TABLE
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

def check_vector_rag_data():
    """Check what data is available in the vector RAG table"""
    
    print(f"Checking Vector RAG table: {RAG_TABLE}")
    print("="*60)
    
    try:
        with psycopg2.connect(DB_URL) as conn:
            with conn.cursor() as cur:
                # Check if table exists in public schema
                cur.execute("""
                    SELECT COUNT(*) FROM rag_chunks4
                """)
                count = cur.fetchone()[0]
                print(f"✅ Found {count} chunks in public.rag_chunks4")
                
                # Get some sample data
                cur.execute("""
                    SELECT chunk_text, metadata
                    FROM rag_chunks4
                    LIMIT 5
                """)
                
                samples = cur.fetchall()
                print(f"\n📋 Sample data from rag_chunks4:")
                for i, (text, metadata) in enumerate(samples, 1):
                    print(f"\n--- Sample {i} ---")
                    print(f"Text: {text[:200]}...")
                    print(f"Metadata: {metadata}")
                
                # Check for student enrollment data specifically
                print(f"\n🔍 Searching for student enrollment data...")
                cur.execute("""
                    SELECT chunk_text, metadata
                    FROM rag_chunks4
                    WHERE chunk_text ILIKE '%student%' OR chunk_text ILIKE '%enrolled%'
                    LIMIT 3
                """)
                
                enrollment_chunks = cur.fetchall()
                for i, (text, metadata) in enumerate(enrollment_chunks, 1):
                    print(f"\n--- Enrollment Chunk {i} ---")
                    print(f"Text: {text[:300]}...")
                    print(f"Metadata: {metadata}")
                
    except Exception as e:
        print(f"❌ Error accessing rag_chunks4: {e}")
        
    # Test the actual vector search
    print(f"\n🧪 Testing Vector RAG Search:")
    print("="*40)
    
    try:
        chunks = get_top_k_chunks("How many students are enrolled?", k=5)
        print(f"Found {len(chunks)} relevant chunks for student enrollment query:")
        
        for i, (text, metadata) in enumerate(chunks, 1):
            print(f"\n--- Relevant Chunk {i} ---")
            print(f"Text: {text[:300]}...")
            print(f"Metadata: {metadata}")
            
    except Exception as e:
        print(f"❌ Error in vector search: {e}")

if __name__ == "__main__":
    check_vector_rag_data()
