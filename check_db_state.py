#!/usr/bin/env python3

import sys
import os
sys.path.append(r"c:\Users\rssh1\Desktop\ClassSight\apps\api")

import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

def check_actual_database():
    """Check the actual database structure and data"""
    
    print("🔍 Checking Current Database State:")
    print("="*50)
    
    try:
        with psycopg2.connect(DB_URL) as conn:
            with conn.cursor() as cur:
                # Check students table
                cur.execute("SELECT COUNT(*) FROM students")
                student_count = cur.fetchone()[0]
                print(f"✅ Total students: {student_count}")
                
                # Check bootcamps table
                cur.execute("SELECT id, name FROM bootcamps ORDER BY id")
                bootcamps = cur.fetchall()
                print(f"\n📋 Available bootcamps:")
                for bootcamp_id, name in bootcamps:
                    print(f"  - ID {bootcamp_id}: {name}")
                
                # Check students by bootcamp
                cur.execute("""
                    SELECT bootcamp_id, COUNT(*) as student_count
                    FROM students
                    GROUP BY bootcamp_id
                    ORDER BY bootcamp_id
                """)
                
                bootcamp_counts = cur.fetchall()
                print(f"\n📊 Students by Bootcamp ID:")
                for bootcamp_id, count in bootcamp_counts:
                    print(f"  - Bootcamp {bootcamp_id}: {count} students")
                
                # Sample student names
                cur.execute("""
                    SELECT s.name, s.bootcamp_id, b.name as bootcamp_name
                    FROM students s
                    LEFT JOIN bootcamps b ON s.bootcamp_id = b.id
                    ORDER BY s.bootcamp_id, s.name
                    LIMIT 15
                """)
                sample_students = cur.fetchall()
                print(f"\n👥 Sample students:")
                for name, bootcamp_id, bootcamp_name in sample_students:
                    print(f"  - {name} → Bootcamp {bootcamp_id} ({bootcamp_name})")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_actual_database()
