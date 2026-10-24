import os
import tempfile

os.environ["SQLITE_DB_PATH"] = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["MONGO_URL"] = "mongomock://localhost"
os.environ["MONGO_DB_NAME"] = "testdb"

import mongomock
import finance_tracker.database as dbmod
dbmod.get_mongo_client = lambda: mongomock.MongoClient()
dbmod._mongo_client = mongomock.MongoClient()

import pytest
from fastapi.testclient import TestClient
from finance_tracker.api.main import app
from finance_tracker.database import init_sqlite, SQLITE_DB_PATH

init_sqlite(SQLITE_DB_PATH)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def user_id(client):
    import uuid
    r = client.post("/api/users", json={"name": "Test", "email": f"t{uuid.uuid4()}@example.com"})
    return r.json()["user_id"]
