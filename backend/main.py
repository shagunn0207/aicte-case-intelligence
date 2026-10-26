import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import init_db
from backend.routes.institutions import router as institutions_router
from backend.routes.cases import router as cases_router
from backend.routes.actions import router as actions_router
from backend.routes.overlaps import router as overlaps_router
from backend.routes.dashboard import router as dashboard_router
from backend.routes.alerts import router as alerts_router
from backend.schemas import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle management.
    Initializes database tables on startup.
    """
    init_db()
    yield


app = FastAPI(
    title="AICTE Case Intelligence API",
    description=(
        "Integrated Dashboard for Monitoring and Tracking Institution-Related "
        "Complaint Cases Across AICTE Bureaus/Cells (SIH 2026 - SIH26264)"
    ),
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
# Allow frontend dev origins (Vite on :5173, Next.js/React on :3000, etc.)
raw_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
)
origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Endpoint
@app.get("/api/health", response_model=HealthResponse, tags=["System"])
def health_check():
    """
    Lightweight health check endpoint to confirm application availability.
    """
    return HealthResponse(status="ok")


# Include feature routers
app.include_router(institutions_router)
app.include_router(cases_router)
app.include_router(actions_router)
app.include_router(overlaps_router)
app.include_router(dashboard_router)
app.include_router(alerts_router)


@app.get("/", tags=["System"])
def root():
    return {
        "project": "AICTE Case Intelligence API",
        "problem_statement": "SIH26264",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
