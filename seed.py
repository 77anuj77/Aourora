import datetime
import os
import random

from faker import Faker

from finance_tracker.database import init_sqlite, get_connection, get_mongo_db
from finance_tracker import crud, nosql

fake = Faker()

init_sqlite()
conn = get_connection()
# clear
for t in ("budget_alerts", "query_history", "transactions", "budgets", "users"):
    conn.execute(f"DELETE FROM {t}")
conn.commit()

# user
uid = crud.create_user("Anuj Paroha", "anujparoaha07@gmail.com")
categories = ["Food", "Travel", "Books", "Entertainment", "Utilities"]
# transactions
today = datetime.date.today()
for i in range(15):
    d = today.replace(day=random.randint(1, 28))
    ttype = "income" if i < 3 else "expense"
    cat = "Allowance" if ttype == "income" else random.choice(categories)
    amt = round(random.uniform(50, 500), 2) if ttype == "expense" else round(random.uniform(5000, 12000), 2)
    crud.create_transaction({
        "user_id": uid,
        "type": ttype,
        "amount": amt,
        "category": cat,
        "description": fake.sentence(nb_words=4),
        "date": d.isoformat(),
    }, conn=conn)
conn.commit()

# budgets
month = today.strftime("%Y-%m")
for cat in categories:
    crud.create_budget({"user_id": uid, "category": cat, "limit_amount": round(random.uniform(1000, 5000), 2), "month": month}, conn=conn)
conn.commit()
conn.close()

# mongo
db = get_mongo_db()
db.activity_logs.delete_many({})
db.financial_insights.delete_many({})
for cat in categories:
    db.financial_insights.insert_one({"category": cat, "monthly_total": round(random.uniform(200, 2000), 2), "month": month})
db.activity_logs.insert_one({"action": "seed", "entity": "system", "details": {}, "timestamp": datetime.datetime.utcnow().isoformat() + "Z"})
print("Seeded. Demo user_id =", uid)
