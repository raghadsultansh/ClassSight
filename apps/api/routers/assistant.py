from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from datetime import datetime
from uuid import uuid4, UUID
import asyncpg
import json

from core.deps import get_current_user, assert_bootcamp_scope
from db.pool import get_pool
from models.schemas import AssistantQuery, AssistantReply

# Import RAG systems
try:
    from utils.sql_rag import answer_question
    from utils.vector_rag import rag_answer
    SQL_RAG_AVAILABLE = True
    VECTOR_RAG_AVAILABLE = True
except ImportError as e:
    print(f"Warning: RAG imports failed: {e}")
    SQL_RAG_AVAILABLE = False
    VECTOR_RAG_AVAILABLE = False

router = APIRouter()


@router.post("/query", response_model=AssistantReply)
async def query_assistant(query: AssistantQuery):
    """Chat with the AI assistant"""
    pool = get_pool()
    
    try:
        # Ensure we have a session ID
        session_id = query.session_id or uuid4()
        
        # Create a default user for session tracking (no auth required)
        default_user_id = UUID("00000000-0000-0000-0000-000000000000")  # Anonymous user UUID
        
        # Upsert chat session
        await _ensure_chat_session(pool, session_id, default_user_id, query.bootcamp_id)
        
        # Store user message
        user_message_id = await _store_message(
            pool, session_id, default_user_id, "user", query.query
        )
        
        # Call RAG system (no user needed for RAG)
        rag_response = await _call_rag_system(query, None)
        
        # Store assistant response
        assistant_message_id = await _store_message(
            pool, session_id, default_user_id, "assistant", 
            rag_response["answer"], rag_response.get("sources", [])
        )
        
        return AssistantReply(
            session_id=session_id,
            answer=rag_response["answer"],
            sources=rag_response.get("sources", []),
            tokens_used=rag_response.get("tokens_used")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process query: {str(e)}"
        )


async def _ensure_chat_session(
    pool: asyncpg.Pool,
    session_id: UUID,
    user_id: UUID,
    bootcamp_id: int = None
) -> None:
    """Ensure chat session exists, create if not."""
    
    # Check if session exists
    existing = await pool.fetchrow(
        "SELECT 1 FROM chat_sessions WHERE id = $1",
        session_id
    )
    
    if not existing:
        # Create new session
        await pool.execute("""
            INSERT INTO chat_sessions (id, user_id, title, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
        """, session_id, user_id, 'New Conversation')
    else:
        # Update session timestamp
        await pool.execute(
            "UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1",
            session_id
        )


async def _store_message(
    pool: asyncpg.Pool,
    session_id: UUID,
    user_id: UUID,
    role: str,
    content: str,
    sources: list = None
) -> UUID:
    """Store a chat message and return its ID."""
    
    message_id = uuid4()
    
    await pool.execute("""
        INSERT INTO chat_messages (
            id, session_id, role, content, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
    """, message_id, session_id, role, content, json.dumps({"sources": sources or []}))
    
    return message_id


async def _call_rag_system(query: AssistantQuery, user: Dict[str, Any] = None) -> Dict[str, Any]:
    """Process query with RAG system - V2 (SQL) is default, fallback to V1 (Vector) if V2 fails"""
    
    # Determine which system to try first
    if query.rag_system == 'vector':
        # User explicitly requested Vector RAG (V1)
        try:
            if not VECTOR_RAG_AVAILABLE:
                return {
                    "answer": "I apologize, but the Vector RAG system (V1) is not available at the moment. Please try using V2 instead.",
                    "sources": [],
                    "tokens_used": None
                }
            
            result = rag_answer(query.query)
            
            return {
                "answer": result["answer"],
                "sources": result.get("sources", []),
                "tokens_used": None
            }
        except Exception as e:
            print(f"Vector RAG Error (user requested): {e}")
            return {
                "answer": f"I apologize, but the Vector RAG system (V1) encountered an error. Please try using V2 instead. Error: {str(e)}",
                "sources": [],
                "tokens_used": None
            }
    
    else:
        # Default behavior: Try SQL RAG (V2) first, fallback to Vector RAG (V1) if it fails
        
        # Try SQL RAG first (V2 - preferred system)
        try:
            if SQL_RAG_AVAILABLE:
                result = answer_question(query.query)
                
                return {
                    "answer": result["answer"],
                    "sources": result.get("sources", []),
                    "tokens_used": None,
                    "system_used": "sql"  # Track which system was used
                }
        except Exception as e:
            print(f"SQL RAG failed, falling back to Vector RAG: {e}")
        
        # Fallback to Vector RAG (V1) if SQL RAG failed
        try:
            if VECTOR_RAG_AVAILABLE:
                print("Falling back to Vector RAG system...")
                result = rag_answer(query.query)
                
                return {
                    "answer": f"{result['answer']}\n\n*Note: Answered using backup system (V1) due to primary system unavailability.*",
                    "sources": result.get("sources", []),
                    "tokens_used": None,
                    "system_used": "vector_fallback"  # Track that this was a fallback
                }
        except Exception as e:
            print(f"Both RAG systems failed: {e}")
        
        # If both systems failed
        return {
            "answer": "I apologize, but both AI systems are currently unavailable. Please try again later or contact support if the issue persists.",
            "sources": [],
            "tokens_used": None,
            "system_used": "none"
        }


# Optional: Get chat history
@router.get("/sessions/{session_id}/messages")
async def get_chat_history(
    session_id: UUID,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get chat history for a session."""
    pool = get_pool()
    
    try:
        # Verify session belongs to user (no bootcamp_id in chat_sessions schema)
        session = await pool.fetchrow("""
            SELECT id FROM chat_sessions 
            WHERE id = $1 AND user_id = $2
        """, session_id, user["user_id"])
        
        if not session:
            raise HTTPException(
                status_code=404,
                detail="Chat session not found"
            )
        
        # Get messages
        messages = await pool.fetch("""
            SELECT id, role, content, metadata, created_at
            FROM chat_messages 
            WHERE session_id = $1
            ORDER BY created_at ASC
        """, session_id)
        
        return {
            "session_id": session_id,
            "messages": [
                {
                    "message_id": msg['id'],
                    "role": msg['role'],
                    "content": msg['content'],
                    "sources": msg['metadata'].get('sources', []) if msg['metadata'] else [],
                    "created_at": msg['created_at']
                }
                for msg in messages
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch chat history: {str(e)}"
        )


# Optional: List user's chat sessions
@router.get("/sessions")
async def get_chat_sessions(
    user: Dict[str, Any] = Depends(get_current_user)
):
    """Get user's chat sessions."""
    pool = get_pool()
    
    try:
        sessions = await pool.fetch("""
            SELECT 
                cs.id as session_id,
                cs.title,
                cs.created_at,
                cs.updated_at,
                COUNT(cm.id) as message_count
            FROM chat_sessions cs
            LEFT JOIN chat_messages cm ON cs.id = cm.session_id
            WHERE cs.user_id = $1
            GROUP BY cs.id, cs.title, cs.created_at, cs.updated_at
            ORDER BY cs.updated_at DESC
        """, user["user_id"])
        
        return {
            "sessions": [
                {
                    "session_id": session['session_id'],
                    "title": session['title'],
                    "created_at": session['created_at'],
                    "updated_at": session['updated_at'],
                    "message_count": session['message_count']
                }
                for session in sessions
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch chat sessions: {str(e)}"
        )