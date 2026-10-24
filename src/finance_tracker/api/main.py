import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from ..database import init_sqlite, SQLITE_DB_PATH
from .routes import users, transactions, budgets, insights, dashboard, database, queries

app = FastAPI(title="Student Finance Tracker", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

routers = [users, transactions, budgets, insights, dashboard, database, queries]

@app.on_event("startup")
def startup():
    init_sqlite(SQLITE_DB_PATH)

for r in routers:
    app.include_router(r.router, prefix="/api")
    app.include_router(r.router, prefix="/api/v1")


@app.get("/")
def health():
    return {"status": "ok", "service": "Student Finance Tracker"}


@app.get("/api")
def api_root():
    return {"status": "ok"}
