from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from datetime import datetime

from core.settings import settings
from db.pool import create_pool, close_pool
from routers import (
    health,
    rbac_probe,
    dashboard,
    assistant,
    reports,
    grades,
    my_bootcamps,
    admin_instructors,
    bootcamps
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting ClassSight API...")
    try:
        await create_pool(settings.database_url)
        logger.info("Database connection established")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down ClassSight API...")
    await close_pool()
    logger.info("Database connection closed")


# Create FastAPI app
app = FastAPI(
    title="ClassSight API",
    description="Backend API for ClassSight educational analytics platform",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(rbac_probe.router, prefix="/rbac", tags=["RBAC"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(assistant.router, prefix="/assistant", tags=["Assistant"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(grades.router, prefix="/grades", tags=["Grades"])
app.include_router(my_bootcamps.router, prefix="/my-bootcamps", tags=["My Bootcamps"])
app.include_router(admin_instructors.router, prefix="/admin/instructors", tags=["Admin"])
app.include_router(bootcamps.router, prefix="/bootcamps", tags=["Bootcamps"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "ClassSight API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "status": "operational"
    }
