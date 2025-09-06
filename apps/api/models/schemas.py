from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any, Union
from datetime import date, datetime
from uuid import UUID


# Shared/Common Models
class UserCtx(BaseModel):
    user_id: UUID
    role: Literal['admin', 'instructor']


class DateRange(BaseModel):
    start: date
    end: date


class BootcampRef(BaseModel):
    bootcamp_id: int
    bootcamp_name: str


# Dashboard Models
class Kpi(BaseModel):
    label: str
    value: Union[float, int]
    delta: Optional[float] = None
    trend: Optional[Literal['up', 'down', 'neutral']] = None


class SeriesPoint(BaseModel):
    t: Union[datetime, date]
    v: float


class LeaderboardEntry(BaseModel):
    id: Union[int, UUID]
    name: str
    value: float
    rank: Optional[int] = None


class DashboardResponse(BaseModel):
    kpis: List[Kpi]
    attention: List[SeriesPoint]
    attendance: List[SeriesPoint]
    capacity: List[SeriesPoint]
    leaderboard_students: List[LeaderboardEntry]
    leaderboard_instructors: List[LeaderboardEntry]


# Reports Models
class ReportRow(BaseModel):
    id: UUID
    title: str
    report_date: date
    status: str
    format: Literal['pdf', 'csv', 'excel']
    storage_path: Optional[str] = None
    bootcamp_id: Optional[int] = None
    bootcamp_name: Optional[str] = None
    created_at: datetime
    file_size: Optional[int] = None


class ReportsList(BaseModel):
    items: List[ReportRow]
    page: int
    page_size: int
    total: Optional[int] = None
    pages: Optional[int] = None


class ReportGenerate(BaseModel):
    title: str
    bootcamp_id: Optional[int] = None
    start_date: date
    end_date: date
    format: Literal['pdf', 'csv', 'excel'] = 'pdf'
    include_data_types: List[str] = Field(default_factory=list)


# Grades Models
class GradeRow(BaseModel):
    grade_id: int
    student_id: int
    student_name: str
    assessment_id: int
    assessment_title: str
    unit_id: int
    unit_name: str
    score: int
    max_score: int
    weight: float
    due_date: date
    bootcamp_id: int
    bootcamp_name: str
    submitted_at: Optional[datetime] = None


class GradePatch(BaseModel):
    score: int = Field(..., ge=0, description="Score must be >= 0")


class GradesList(BaseModel):
    items: List[GradeRow]
    page: int
    page_size: int
    total: Optional[int] = None
    stats: Dict[str, float] = Field(default_factory=dict)


# Assistant/RAG Models
class AssistantQuery(BaseModel):
    session_id: Optional[UUID] = None
    query: str
    kb: Optional[str] = None  # knowledge base scope
    bootcamp_id: Optional[int] = None
    start: Optional[date] = None
    end: Optional[date] = None


class AssistantReply(BaseModel):
    session_id: UUID
    answer: str
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    tokens_used: Optional[int] = None


# Admin/Instructor Management Models
class InstructorRow(BaseModel):
    user_id: UUID
    email: str
    full_name: Optional[str] = None
    status: str
    approved_at: Optional[datetime] = None
    approved_by: Optional[UUID] = None
    created_at: datetime
    bootcamp_count: int = 0


class InstructorsList(BaseModel):
    items: List[InstructorRow]
    page: int
    page_size: int
    total: Optional[int] = None


class AssignmentBody(BaseModel):
    bootcamp_id: int
    is_primary: Optional[bool] = False


class InstructorApproval(BaseModel):
    status: Literal['approved', 'denied']
    reason: Optional[str] = None


# Bootcamps Models
class BootcampRow(BaseModel):
    bootcamp_id: int
    bootcamp_name: str
    start_date: date
    end_date: date
    allow_multiple_instructors: bool = True
    max_instructors: int = 5
    description: Optional[str] = None
    status: Optional[str] = None  # derived: upcoming, active, completed
    student_count: int = 0
    instructor_count: int = 0
    unit_count: int = 0


class BootcampCreate(BaseModel):
    bootcamp_name: str
    start_date: date
    end_date: date
    allow_multiple_instructors: bool = True
    max_instructors: int = Field(default=5, ge=1, le=20)
    description: Optional[str] = None


class BootcampUpdate(BaseModel):
    bootcamp_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    allow_multiple_instructors: Optional[bool] = None
    max_instructors: Optional[int] = Field(None, ge=1, le=20)
    description: Optional[str] = None


class BootcampsList(BaseModel):
    items: List[BootcampRow]
    page: int
    page_size: int
    total: Optional[int] = None


# My Bootcamps (Instructor view)
class MyBootcampRow(BaseModel):
    bootcamp_id: int
    bootcamp_name: str
    start_date: date
    end_date: date
    is_primary: bool
    status: str  # upcoming, active, completed
    student_count: int
    unit_count: int
    assessment_count: int
    avg_attendance: Optional[float] = None
    avg_attention: Optional[float] = None


class MyBootcampsList(BaseModel):
    items: List[MyBootcampRow]
    total: int


# Health Check
class HealthResponse(BaseModel):
    ok: bool = True
    timestamp: datetime
    version: str = "1.0.0"


# Error Response
class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    timestamp: datetime