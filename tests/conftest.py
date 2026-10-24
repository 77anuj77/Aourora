import os
import tempfile
import uuid

os.environ["SQLITE_DB_PATH"] = os.path.join(tempfile.mkdtemp(), "test.db")
os.environ["MONGO_URL"] = "mongomock://localhost"
os.environ["MONGO_DB_NAME"] = "testdb"
os.environ["CLERK_SECRET_KEY"] = "sk_test_dummy"

import mongomock
import finance_tracker.database as dbmod
dbmod.get_mongo_client = lambda: mongomock.MongoClient()
dbmod._mongo_client = mongomock.MongoClient()

from fastapi.testclient import TestClient
from finance_tracker.api.main import app
from finance_tracker.database import init_sqlite, SQLITE_DB_PATH
from finance_tracker import crud
from finance_tracker.auth import get_current_user

init_sqlite(SQLITE_DB_PATH)

# create a test user
conn = dbmod.get_connection(SQLITE_DB_PATH)
uid = crud.create_user("Test User", "test@example.com", clerk_user_id="test_clerk", conn=conn)
conn.commit()
conn.close()

def override_user():
    return {"user_id": uid, "name": "Test User", "email": "test@example.com", "clerk_user_id": "test_clerk"}

app.dependency_overrides[get_current_user] = override_user

import pytest

@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def user_id():
    return uid
