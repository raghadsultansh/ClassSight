!/usr/bin/env python3

import sys
import os
sys.path.append(r"c:\Users\rssh1\Desktop\ClassSight\apps\api")

from utils.sql_rag import answer_question
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

def compare_data_sources():
    """Compare what SQL RAG sees vs Vector RAG"""
    
    print("🔍 Checking SQL Database Tables:")
    print("="*50)
    
    try:
        with psycopg2.connect(DB_URL) as conn:
            with conn.cursor() as cur:
                # Check students table
                cur.execute("SELECT COUNT(*) FROM students")
                student_count = cur.fetchone()[0]
                print(f"✅ Students table: {student_count} students")
                
                # Check students by bootcamp
                cur.execute("""
                    SELECT b.name, COUNT(s.id) as student_count
                    FROM bootcamps b
                    LEFT JOIN students s ON s.bootcamp_id = b.id
                    GROUP BY b.id, b.name
                    ORDER BY b.name
                """)
                
                bootcamp_counts = cur.fetchall()
                print(f"\n📊 Students by Bootcamp:")
                total_enrolled = 0
                for bootcamp_name, count in bootcamp_counts:
                    print(f"  - {bootcamp_name}: {count} students")
                    total_enrolled += count
                
                print(f"\n📈 Total enrolled: {total_enrolled} students")
                
                # Sample student names
                cur.execute("SELECT name, bootcamp_id FROM students LIMIT 10")
                sample_students = cur.fetchall()
                print(f"\n👥 Sample student names from SQL:")
                for name, bootcamp_id in sample_students:
                    print(f"  - {name} (bootcamp_id: {bootcamp_id})")
                
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print(f"\n🧪 Testing SQL RAG Response:")
    print("="*40)
    
    try:
        result = answer_question("How many students are enrolled?")
        print(f"SQL RAG Answer: {result['answer']}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    compare_data_sources()
