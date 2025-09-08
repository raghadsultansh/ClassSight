import os
import re
import json
import psycopg2
from dotenv import load_dotenv
from openai import OpenAI
from typing import Dict, Any, List

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")

if not DB_URL or not OPENAI_KEY:
    raise ValueError("DATABASE_URL or OPENAI_API_KEY not loaded from .env")

client = OpenAI(api_key=OPENAI_KEY)
openai_model = 'gpt-4o-mini'

########################################################
# 1) Get schema
########################################################

_SCHEMA_CACHE = None  # global cache

def get_schema_snapshot(max_sample_rows: int = 10, force_refresh: bool = False) -> str:
    global _SCHEMA_CACHE

    # If _SCHEMA_CACHE already holds the schema AND force_refresh is not set to True, the cached schema is
    # immediately returned and the database query is skipped.
    if _SCHEMA_CACHE is not None and not force_refresh:
        return _SCHEMA_CACHE

    with psycopg2.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                select table_name
                from information_schema.tables
                where table_schema='public'
                  and table_name in ('students','units','grades','attendance','bootcamps','assessments',
                  'grades_summary', 'classroom_synthetic_data_filtered')
                order by table_name;
            """)
            tables = [r[0] for r in cur.fetchall()]

            snapshot_parts = []

            for t in tables:
                # columns
                cur.execute("""
                    select column_name, data_type, is_nullable
                    from information_schema.columns
                    where table_schema='public' and table_name=%s
                    order by ordinal_position;
                """, (t,))
                cols = cur.fetchall()
                col_str = ", ".join([f"{c} {dt}{' NULL' if n=='YES' else ''}" for c, dt, n in cols])

                # foreign keys
                cur.execute("""
                    select
                      kcu.column_name,
                      ccu.table_name as fk_table,
                      ccu.column_name as fk_column
                    from information_schema.table_constraints tc
                    join information_schema.key_column_usage kcu
                      on tc.constraint_name = kcu.constraint_name
                     and tc.table_schema = kcu.table_schema
                    join information_schema.constraint_column_usage ccu
                      on ccu.constraint_name = tc.constraint_name
                     and ccu.table_schema = tc.table_schema
                    where tc.table_schema='public'
                      and tc.table_name=%s
                      and tc.constraint_type='FOREIGN KEY';
                """, (t,))
                fks = cur.fetchall()
                fk_str = "; ".join([f"{col} -> {fk_t}.{fk_c}" for col, fk_t, fk_c in fks]) or "None"

                # sample rows
                cur.execute(f'SELECT * FROM "{t}" LIMIT %s;', (max_sample_rows,))
                rows = cur.fetchall()
                headers = [desc[0] for desc in cur.description]
                sample_json = [dict(zip(headers, r)) for r in rows]

                snapshot_parts.append(
                    f"TABLE {t}\n  COLUMNS: {col_str}\n  FKs: {fk_str}\n  SAMPLES: {json.dumps(sample_json, default=str)}"
                )

            _SCHEMA_CACHE = "\n\n".join(snapshot_parts)
            return _SCHEMA_CACHE

########################################################
# 2) SQL generation by LLM
########################################################

SQL_SYSTEM_INSTRUCTIONS = """You are a careful SQL writer.
- Output ONLY a single SQL statement that answers the user's question.
- Use ANSI SQL compatible with PostgreSQL.
- It must be a single SELECT query (no DDL/DML, no CTEs that modify data).
- Prefer JOINs using the schema; avoid guessing column names that don't exist.
- Use ILIKE with wildcards for fuzzy text (e.g., ILIKE '%' || term || '%') when helpful.
- Always include an ORDER BY where relevant and a LIMIT (<= 100) to cap rows.
- Do not wrap the SQL in code fences or add commentary.
- If multiple rows tie for the same top score / value / result, return all of them.
- When asked for average attendance, give percentages.
"""

def generate_select_sql(question: str, schema_snapshot: str) -> str:
    resp = client.chat.completions.create(
        model=openai_model,
        messages=[
            {"role": "system", "content": SQL_SYSTEM_INSTRUCTIONS},
            {"role": "user", "content": f"Schema:\n{schema_snapshot}\n\nQuestion:\n{question}"}
        ]
    )

    sql = resp.choices[0].message.content.strip()

    # Strip code fences if model ever adds them
    sql = re.sub(r"^```(?:sql)?|```$", "", sql.strip(), flags=re.IGNORECASE|re.MULTILINE).strip()
    return sql

########################################################
# 3) SQL sanitizer
########################################################

def sanitize_sql(sql: str) -> str:
    bad = re.compile(r"\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|MERGE)\b",
                     re.IGNORECASE)
    if bad.search(sql):
        raise ValueError("Unsafe SQL detected. Only SELECT queries are allowed.")
    if not re.match(r"^\s*SELECT\b", sql, flags=re.IGNORECASE):
        raise ValueError("Only a single SELECT statement is allowed.")

    # Ensure single statement
    if ";" in sql.strip()[:-1]:
        raise ValueError("Multiple statements detected. Provide exactly one SELECT.")

    # Add LIMIT if missing
    if not re.search(r"\bLIMIT\s+\d+\b", sql, flags=re.IGNORECASE):
        sql = f"{sql.rstrip(';')} LIMIT 200;"
    return sql

########################################################
# 4) Execute SQL (read-only)
########################################################

def run_readonly_sql(sql: str) -> List[Dict[str, Any]]:
    with psycopg2.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            # read-only + timeout
            cur.execute("SET LOCAL statement_timeout = 5000;")  # 5s
            cur.execute("START TRANSACTION READ ONLY;")

            cur.execute(sql)
            if cur.description is None:
                return []

            cols = [d[0] for d in cur.description]
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
            cur.execute("COMMIT;")
            return rows

########################################################
# 5) Let the model compute/explain
########################################################

# Global variable to store Q&A history
conversation_history = []  # Stores (question, answer) tuples

def llm_answer(question: str, sql: str, rows: List[Dict[str, Any]]) -> str:
    """Ask the model to compute any aggregates from the rows and answer concisely."""
    # If no results, return early
    if not rows:
        return f"No relevant data found. Please check that you entered the correct student name, bootcamp, or unit title."

    # Build context from the last 5 Q&A pairs
    recent_context = "\n".join([
        f"Q: {q}\nA: {a}" for q, a in conversation_history[-5:]
    ])

    # Prepare prompt with memory + current data
    prompt = (
        f"Conversation so far:\n{recent_context}\n\n"
        f"Current Question: {question}\n"
        f"SQL: {sql}\n"
        f"Rows: {json.dumps(rows, default=str)}"
    )

    # Call the LLM with added context
    resp = client.chat.completions.create(
        model=openai_model,
        messages=[
            {"role": "system", "content": "You are a precise analyst. Use the provided rows and context to answer succinctly. Always check whether the student has taken the unit or is enrolled in the bootcamp. Do not mention the SQL query in your final output."},
            {"role": "user", "content": prompt}
        ]
    )

    # Extract the answer from the LLM response
    answer = resp.choices[0].message.content.strip()

    # Save this Q&A in memory
    conversation_history.append((question, answer))

    return answer

########################################################
# 6) Orchestrator
########################################################

def answer_question(question: str) -> Dict[str, Any]:
    # --- schema ---
    schema = get_schema_snapshot(max_sample_rows=10)

    # --- sql generation ---
    sql = generate_select_sql(question, schema)

    try:
        sql_safe = sanitize_sql(sql)
    except Exception as e:
        return {
            "answer": f"Failed to validate SQL. Error: {e}",
            "sql": sql,
            "sources": [],
            "rows": []
        }

    # --- DB exec ---
    try:
        rows = run_readonly_sql(sql_safe)

        # --- LLM answer ---
        ans = llm_answer(question, sql_safe, rows)
        
        # Format sources for API response
        sources = []
        if rows:
            sources.append({
                "type": "database_query",
                "sql": sql_safe,
                "row_count": len(rows),
                "tables_used": _extract_table_names(sql_safe)
            })

        return {
            "answer": ans,
            "sql": sql_safe,
            "sources": sources,
            "rows": rows[:10]  # Limit rows in response for performance
        }

    except Exception as e:
        # Auto-retry once by sharing the error with the model to refine SQL
        err = str(e)
        try:
            resp = client.chat.completions.create(
                model=openai_model,
                messages=[
                    {"role": "system", "content": SQL_SYSTEM_INSTRUCTIONS},
                    {"role": "user",
                     "content": f"Schema:\n{schema}\n\nQuestion:\n{question}\n\nThe previous SQL failed with error:\n{err}\n\nRevise and return ONLY a safe single SELECT with LIMIT."}
                ]
            )
            sql2 = sanitize_sql(resp.choices[0].message.content.strip())
            rows2 = run_readonly_sql(sql2)
            ans2 = llm_answer(question, sql2, rows2)

            sources = []
            if rows2:
                sources.append({
                    "type": "database_query",
                    "sql": sql2,
                    "row_count": len(rows2),
                    "tables_used": _extract_table_names(sql2),
                    "retry": True
                })

            return {
                "answer": ans2,
                "sql": sql2,
                "sources": sources,
                "rows": rows2[:10]
            }
        except Exception as retry_err:
            return {
                "answer": f"I encountered an error while processing your query. Please try rephrasing your question or contact support if the issue persists.",
                "sql": sql,
                "sources": [],
                "rows": [],
                "error": str(retry_err)
            }


def _extract_table_names(sql: str) -> List[str]:
    """Extract table names from SQL query for source metadata."""
    # Simple regex to extract table names after FROM and JOIN
    tables = []
    from_matches = re.findall(r'\bFROM\s+(\w+)', sql, re.IGNORECASE)
    join_matches = re.findall(r'\bJOIN\s+(\w+)', sql, re.IGNORECASE)
    tables.extend(from_matches)
    tables.extend(join_matches)
    return list(set(tables))  # Remove duplicates
