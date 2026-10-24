def test_health(client):
    r = client.get("/")
    assert r.status_code == 200

def test_create_transaction_and_list(client, user_id):
    r = client.post("/api/transactions", json={"user_id": user_id, "type": "expense", "amount": 100, "category": "Food", "description": "lunch", "date": "2026-10-02"})
    assert r.status_code == 200
    tid = r.json()["transaction_id"]
    r2 = client.get("/api/transactions", params={"user_id": user_id})
    assert any(t["transaction_id"] == tid for t in r2.json())

def test_budget_vs_actual(client, user_id):
    client.post("/api/budgets", json={"user_id": user_id, "category": "Food", "limit_amount": 3000, "month": "2026-10"})
    r = client.get(f"/api/budgets/{user_id}/vs-actual", params={"month": "2026-10"})
    assert r.status_code == 200

def test_sql_execute(client, user_id):
    r = client.post("/api/query/sql/execute", json={"database": "sqlite", "table": "transactions", "operation": "select", "limit": 5})
    assert r.json()["success"] is True

def test_dashboard(client, user_id):
    r = client.get("/api/dashboard/summary", params={"user_id": user_id})
    assert r.status_code == 200
