from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import sensor_data, fukuzono, analytics_extra, ingest

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mine Subsidence Monitor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensor_data.router)
app.include_router(fukuzono.router)
app.include_router(analytics_extra.router)
app.include_router(ingest.router)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Mine Subsidence Monitor backend is running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}