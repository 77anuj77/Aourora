import csv
import io
from typing import List, Dict, Any

from .database import get_connection
from . import crud


def export_transactions_csv(user_id=None) -> str:
    conn = get_connection()
    try:
        rows = crud.list_transactions(user_id, conn=conn)
    finally:
        conn.close()
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=["transaction_id", "user_id", "type", "amount", "category", "description", "date"])
    writer.writeheader()
    for r in rows:
        writer.writerow(r)
    return buf.getvalue()


def import_transactions_csv(csv_text: str) -> int:
    reader = csv.DictReader(io.StringIO(csv_text))
    conn = get_connection()
    try:
        count = 0
        for row in reader:
            data = {
                "user_id": int(row["user_id"]),
                "type": row["type"],
                "amount": float(row["amount"]),
                "category": row["category"],
                "description": row.get("description") or None,
                "date": row["date"],
            }
            crud.create_transaction(data, conn=conn)
            count += 1
        conn.commit()
        return count
    finally:
        conn.close()
