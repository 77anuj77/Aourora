import os
import sqlite3
import threading
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", "./data/finance_tracker.db")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "finance_tracker")

_mongo_client = None
_mongo_lock = threading.Lock()


def get_connection(db_path: str = None) -> sqlite3.Connection:
    path = db_path or SQLITE_DB_PATH
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_sqlite(db_path: str = None):
    path = db_path or SQLITE_DB_PATH
    base = Path(__file__).resolve().parents[2]
    sql_dir = base / "sql"
    conn = get_connection(path)
    try:
        for fname in ("schema.sql", "indexes.sql", "triggers.sql"):
            sql = (sql_dir / fname).read_text()
            conn.executescript(sql)
        # migration: add clerk_user_id column if missing
        cols = [r["name"] for r in conn.execute("PRAGMA table_info(users)").fetchall()]
        if "clerk_user_id" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN clerk_user_id TEXT")
        # unique index
        conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_clerk ON users(clerk_user_id)")
        conn.commit()
    finally:
        conn.close()


def get_mongo_client():
    global _mongo_client
    with _mongo_lock:
        if _mongo_client is None:
            _mongo_client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        return _mongo_client


def get_mongo_db():
    return get_mongo_client()[MONGO_DB_NAME]


def mongo_available() -> bool:
    try:
        get_mongo_client().admin.command("ping")
        return True
    except Exception:
        return False


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"
