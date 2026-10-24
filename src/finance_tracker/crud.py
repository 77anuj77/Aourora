import json
import sqlite3
import time
from typing import Any, Dict, List, Optional

from .database import get_connection, now_iso

ALLOWED_TABLES = {"users", "transactions", "budgets", "budget_alerts", "query_history"}
TABLE_COLUMNS = {
    "users": ["user_id", "name", "email"],
    "transactions": ["transaction_id", "user_id", "type", "amount", "category", "description", "date"],
    "budgets": ["budget_id", "user_id", "category", "limit_amount", "month"],
    "budget_alerts": ["alert_id", "budget_id", "message", "created_at"],
    "query_history": ["history_id", "database_name", "operation", "preview", "parameters", "status", "affected_rows", "duration_ms", "created_at"],
}
TABLE_PK = {
    "users": "user_id",
    "transactions": "transaction_id",
    "budgets": "budget_id",
    "budget_alerts": "alert_id",
    "query_history": "history_id",
}

FOREIGN_KEYS = {
    "transactions": [{"column": "user_id", "ref_table": "users", "ref_column": "user_id"}],
    "budgets": [{"column": "user_id", "ref_table": "users", "ref_column": "user_id"}],
    "budget_alerts": [{"column": "budget_id", "ref_table": "budgets", "ref_column": "budget_id"}],
}


def row_to_dict(row):
    if row is None:
        return None
    return {k: row[k] for k in row.keys()}


def list_users(conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        rows = c.execute("SELECT * FROM users ORDER BY user_id").fetchall()
        return [row_to_dict(r) for r in rows]
    finally:
        if close:
            c.close()


def get_user(user_id, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        row = c.execute("SELECT * FROM users WHERE user_id = ?", (user_id,)).fetchone()
        return row_to_dict(row)
    finally:
        if close:
            c.close()


def create_user(name, email, clerk_user_id=None, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        cur = c.execute("INSERT INTO users (name, email, clerk_user_id) VALUES (?, ?, ?)", (name, email, clerk_user_id))
        c.commit()
        return cur.lastrowid
    finally:
        if close:
            c.close()

def get_user_by_clerk(clerk_user_id, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        row = c.execute("SELECT * FROM users WHERE clerk_user_id = ?", (clerk_user_id,)).fetchone()
        return row_to_dict(row)
    finally:
        if close:
            c.close()


def list_transactions(user_id=None, conn=None, filters=None):
    c = conn or get_connection()
    close = conn is None
    try:
        q = "SELECT * FROM transactions"
        params = []
        clauses = []
        if user_id is not None:
            clauses.append("user_id = ?")
            params.append(user_id)
        if filters:
            if filters.get("type"):
                clauses.append("type = ?")
                params.append(filters["type"])
            if filters.get("category"):
                clauses.append("category = ?")
                params.append(filters["category"])
            if filters.get("date_from"):
                clauses.append("date >= ?")
                params.append(filters["date_from"])
            if filters.get("date_to"):
                clauses.append("date <= ?")
                params.append(filters["date_to"])
            if filters.get("search"):
                clauses.append("(description LIKE ? OR category LIKE ?)")
                params.append(f"%{filters['search']}%")
                params.append(f"%{filters['search']}%")
        if clauses:
            q += " WHERE " + " AND ".join(clauses)
        q += " ORDER BY date DESC, transaction_id DESC"
        if filters and filters.get("limit"):
            q += " LIMIT ?"
            params.append(filters["limit"])
        rows = c.execute(q, params).fetchall()
        return [row_to_dict(r) for r in rows]
    finally:
        if close:
            c.close()


def get_transaction(tid, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        row = c.execute("SELECT * FROM transactions WHERE transaction_id = ?", (tid,)).fetchone()
        return row_to_dict(row)
    finally:
        if close:
            c.close()


def create_transaction(data: Dict[str, Any], conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        cur = c.execute(
            "INSERT INTO transactions (user_id, type, amount, category, description, date) VALUES (?,?,?,?,?,?)",
            (data["user_id"], data["type"], data["amount"], data["category"], data.get("description"), data["date"]),
        )
        c.commit()
        return cur.lastrowid
    finally:
        if close:
            c.close()


def update_transaction(tid, data: Dict[str, Any], conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        fields = []
        params = []
        for col in ("type", "amount", "category", "description", "date"):
            if col in data and data[col] is not None:
                fields.append(f"{col} = ?")
                params.append(data[col])
        if not fields:
            return 0
        params.append(tid)
        cur = c.execute(f"UPDATE transactions SET {', '.join(fields)} WHERE transaction_id = ?", params)
        c.commit()
        return cur.rowcount
    finally:
        if close:
            c.close()


def delete_transaction(tid, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        cur = c.execute("DELETE FROM transactions WHERE transaction_id = ?", (tid,))
        c.commit()
        return cur.rowcount
    finally:
        if close:
            c.close()


def transactions_with_user(user_id=None, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        q = """SELECT u.name, t.transaction_id, t.user_id, t.type, t.amount, t.category, t.description, t.date
               FROM users u INNER JOIN transactions t ON t.user_id = u.user_id"""
        params = []
        if user_id is not None:
            q += " WHERE u.user_id = ?"
            params.append(user_id)
        q += " ORDER BY t.date DESC"
        rows = c.execute(q, params).fetchall()
        return [row_to_dict(r) for r in rows]
    finally:
        if close:
            c.close()


def spending_by_category(user_id, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        rows = c.execute(
            "SELECT category, SUM(amount) AS total_spent FROM transactions WHERE user_id = ? AND type = 'expense' GROUP BY category ORDER BY total_spent DESC",
            (user_id,),
        ).fetchall()
        return [row_to_dict(r) for r in rows]
    finally:
        if close:
            c.close()


def monthly_trend(user_id, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        rows = c.execute(
            "SELECT substr(date,1,7) AS month, type, SUM(amount) AS total FROM transactions WHERE user_id = ? GROUP BY month, type ORDER BY month",
            (user_id,),
        ).fetchall()
        return [row_to_dict(r) for r in rows]
    finally:
        if close:
            c.close()


def budget_vs_actual(user_id, month, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        rows = c.execute(
            """SELECT b.category, b.month, b.limit_amount,
                      COALESCE(SUM(t.amount),0) AS spent,
                      b.limit_amount - COALESCE(SUM(t.amount),0) AS remaining
               FROM budgets b
               LEFT JOIN transactions t ON t.user_id = b.user_id AND t.category = b.category AND t.type='expense' AND substr(t.date,1,7)=b.month
               WHERE b.user_id = ? AND b.month = ?
               GROUP BY b.budget_id, b.category, b.month, b.limit_amount""",
            (user_id, month),
        ).fetchall()
        out = []
        for r in rows:
            d = row_to_dict(r)
            limit = d["limit_amount"] or 0
            spent = d["spent"] or 0
            d["utilization"] = (spent / limit * 100) if limit else 0
            out.append(d)
        return out
    finally:
        if close:
            c.close()


def aggregate_stats(user_id, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        row = c.execute(
            """SELECT COUNT(*) AS expense_count, COALESCE(SUM(amount),0) AS total_expense,
                      COALESCE(AVG(amount),0) AS avg_expense, COALESCE(MIN(amount),0) AS min_expense,
                      COALESCE(MAX(amount),0) AS max_expense
               FROM transactions WHERE user_id = ? AND type='expense'""",
            (user_id,),
        ).fetchone()
        return row_to_dict(row)
    finally:
        if close:
            c.close()


def dashboard_summary(user_id, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        inc = c.execute("SELECT COALESCE(SUM(amount),0) AS s FROM transactions WHERE user_id=? AND type='income'", (user_id,)).fetchone()["s"]
        exp = c.execute("SELECT COALESCE(SUM(amount),0) AS s FROM transactions WHERE user_id=? AND type='expense'", (user_id,)).fetchone()["s"]
        month = None
        # current month from data or now
        import datetime as dt
        month = dt.date.today().strftime("%Y-%m")
        minc = c.execute("SELECT COALESCE(SUM(amount),0) AS s FROM transactions WHERE user_id=? AND type='income' AND substr(date,1,7)=?", (user_id, month)).fetchone()["s"]
        mexp = c.execute("SELECT COALESCE(SUM(amount),0) AS s FROM transactions WHERE user_id=? AND type='expense' AND substr(date,1,7)=?", (user_id, month)).fetchone()["s"]
        # budget remaining: sum limits - sum spent for current month
        budgets = budget_vs_actual(user_id, month, conn=c)
        budget_remaining = sum(b["remaining"] for b in budgets) if budgets else 0
        return {
            "user_id": user_id,
            "total_income": inc,
            "total_expense": exp,
            "balance": inc - exp,
            "budget_remaining": budget_remaining,
            "monthly_income": minc,
            "monthly_expense": mexp,
        }
    finally:
        if close:
            c.close()


# Budgets
def list_budgets(user_id=None, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        q = "SELECT * FROM budgets"
        params = []
        if user_id is not None:
            q += " WHERE user_id = ?"
            params.append(user_id)
        q += " ORDER BY month DESC, budget_id DESC"
        rows = c.execute(q, params).fetchall()
        return [row_to_dict(r) for r in rows]
    finally:
        if close:
            c.close()


def get_budget(bid, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        row = c.execute("SELECT * FROM budgets WHERE budget_id = ?", (bid,)).fetchone()
        return row_to_dict(row)
    finally:
        if close:
            c.close()


def create_budget(data, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        # upsert by unique(user_id,category,month)
        existing = c.execute(
            "SELECT budget_id FROM budgets WHERE user_id=? AND category=? AND month=?",
            (data["user_id"], data["category"], data["month"]),
        ).fetchone()
        if existing:
            c.execute(
                "UPDATE budgets SET limit_amount=? WHERE budget_id=?",
                (data["limit_amount"], existing["budget_id"]),
            )
            c.commit()
            return existing["budget_id"]
        cur = c.execute(
            "INSERT INTO budgets (user_id, category, limit_amount, month) VALUES (?,?,?,?)",
            (data["user_id"], data["category"], data["limit_amount"], data["month"]),
        )
        c.commit()
        return cur.lastrowid
    finally:
        if close:
            c.close()


def update_budget(bid, data, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        fields = []
        params = []
        for col in ("category", "limit_amount", "month"):
            if col in data and data[col] is not None:
                fields.append(f"{col} = ?")
                params.append(data[col])
        if not fields:
            return 0
        params.append(bid)
        cur = c.execute(f"UPDATE budgets SET {', '.join(fields)} WHERE budget_id = ?", params)
        c.commit()
        return cur.rowcount
    finally:
        if close:
            c.close()


def delete_budget(bid, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        cur = c.execute("DELETE FROM budgets WHERE budget_id = ?", (bid,))
        c.commit()
        return cur.rowcount
    finally:
        if close:
            c.close()


def list_budget_alerts(user_id=None, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        q = """SELECT ba.* FROM budget_alerts ba JOIN budgets b ON b.budget_id=ba.budget_id"""
        params = []
        if user_id is not None:
            q += " WHERE b.user_id = ?"
            params.append(user_id)
        q += " ORDER BY ba.alert_id DESC"
        rows = c.execute(q, params).fetchall()
        return [row_to_dict(r) for r in rows]
    finally:
        if close:
            c.close()


# Schema metadata
def list_tables():
    return sorted(ALLOWED_TABLES)


def table_schema(table):
    if table not in ALLOWED_TABLES:
        raise ValueError("Table not allowed")
    cols = []
    # use PRAGMA table_info
    c = get_connection()
    try:
        for r in c.execute(f"PRAGMA table_info({table})").fetchall():
            cols.append({
                "name": r["name"],
                "type": r["type"],
                "notnull": bool(r["notnull"]),
                "pk": bool(r["pk"]),
                "default": r["dflt_value"],
            })
        fks = []
        for r in c.execute(f"PRAGMA foreign_key_list({table})").fetchall():
            fks.append({
                "column": r["from"],
                "ref_table": r["table"],
                "ref_column": r["to"],
            })
        idxs = []
        for r in c.execute(f"PRAGMA index_list({table})").fetchall():
            idxs.append({"name": r["name"], "unique": bool(r["unique"])})
        return {"table": table, "columns": cols, "foreign_keys": fks, "indexes": idxs}
    finally:
        c.close()


def table_rows(table, limit=50, offset=0, conn=None):
    if table not in ALLOWED_TABLES:
        raise ValueError("Table not allowed")
    c = conn or get_connection()
    close = conn is None
    try:
        total = c.execute(f"SELECT COUNT(*) AS n FROM {table}").fetchone()["n"]
        rows = c.execute(f"SELECT * FROM {table} ORDER BY 1 DESC LIMIT ? OFFSET ?", (limit, offset)).fetchall()
        return {"total": total, "rows": [row_to_dict(r) for r in rows]}
    finally:
        if close:
            c.close()


def list_triggers():
    c = get_connection()
    try:
        rows = c.execute("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='trigger'").fetchall()
        return [{"name": r["name"], "table": r["tbl_name"], "sql": r["sql"]} for r in rows]
    finally:
        c.close()


def list_views():
    c = get_connection()
    try:
        rows = c.execute("SELECT name, sql FROM sqlite_master WHERE type='view'").fetchall()
        return [{"name": r["name"], "sql": r["sql"]} for r in rows]
    finally:
        c.close()


def list_indexes():
    c = get_connection()
    try:
        rows = c.execute("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL").fetchall()
        return [{"name": r["name"], "table": r["tbl_name"], "sql": r["sql"]} for r in rows]
    finally:
        c.close()


def full_schema():
    tables = []
    for t in sorted(ALLOWED_TABLES):
        tables.append(table_schema(t))
    return {"tables": tables, "triggers": list_triggers(), "views": list_views(), "indexes": list_indexes(), "foreign_keys": FOREIGN_KEYS}


def execute_sql_structured(req, conn=None):
    """Execute structured operation, return (preview, params, affected, rows)."""
    table = req.table
    if table not in ALLOWED_TABLES or table == "query_history":
        raise ValueError("Table not allowed for operations")
    op = req.operation
    c = conn or get_connection()
    close = conn is None
    # We'll manage commit externally? For simplicity commit here.
    try:
        if op == "insert":
            values = req.values or {}
            cols = list(values.keys())
            for col in cols:
                if col not in TABLE_COLUMNS[table]:
                    raise ValueError(f"Unknown column {col}")
            placeholders = ", ".join(["?"] * len(cols))
            colsql = ", ".join(cols)
            sql = f"INSERT INTO {table} ({colsql}) VALUES ({placeholders})"
            params = [values[col] for col in cols]
            cur = c.execute(sql, params)
            c.commit()
            # fetch inserted row
            pk = TABLE_PK[table]
            rid = cur.lastrowid
            row = c.execute(f"SELECT * FROM {table} WHERE {pk} = ?", (rid,)).fetchone()
            rows = [row_to_dict(row)] if row else None
            return sql, params, cur.rowcount, rows
        elif op == "select":
            cols = req.columns or ["*"]
            if cols != ["*"]:
                for col in cols:
                    if col not in TABLE_COLUMNS[table]:
                        raise ValueError(f"Unknown column {col}")
            colsql = ", ".join(cols)
            sql = f"SELECT {colsql} FROM {table}"
            params = []
            clauses = []
            if req.conditions:
                for cond in req.conditions:
                    col = cond.get("column")
                    if col not in TABLE_COLUMNS[table]:
                        raise ValueError(f"Unknown column {col}")
                    oper = cond.get("operator", "=")
                    if oper not in ("=", "!=", ">", "<", ">=", "<=", "LIKE"):
                        raise ValueError("Unsupported operator")
                    clauses.append(f"{col} {oper} ?")
                    params.append(cond.get("value"))
            if clauses:
                sql += " WHERE " + " AND ".join(clauses)
            if req.order_by:
                if req.order_by not in TABLE_COLUMNS[table]:
                    raise ValueError("Unknown order column")
                direction = "DESC" if (req.order_dir or "DESC").upper() == "DESC" else "ASC"
                sql += f" ORDER BY {req.order_by} {direction}"
            if req.limit:
                sql += " LIMIT ?"
                params.append(int(req.limit))
            cur = c.execute(sql, params)
            rows = [row_to_dict(r) for r in cur.fetchall()]
            return sql, params, len(rows), rows
        elif op == "update":
            if not req.set_values:
                raise ValueError("set_values required")
            fields = []
            params = []
            for col, val in req.set_values.items():
                if col not in TABLE_COLUMNS[table]:
                    raise ValueError(f"Unknown column {col}")
                fields.append(f"{col} = ?")
                params.append(val)
            sql = f"UPDATE {table} SET {', '.join(fields)}"
            clauses = []
            if req.record_id is not None:
                pk = TABLE_PK[table]
                clauses.append(f"{pk} = ?")
                params.append(req.record_id)
            if req.conditions:
                for cond in req.conditions:
                    col = cond.get("column")
                    if col not in TABLE_COLUMNS[table]:
                        raise ValueError(f"Unknown column {col}")
                    oper = cond.get("operator", "=")
                    clauses.append(f"{col} {oper} ?")
                    params.append(cond.get("value"))
            if clauses:
                sql += " WHERE " + " AND ".join(clauses)
            cur = c.execute(sql, params)
            c.commit()
            return sql, params, cur.rowcount, None
        elif op == "delete":
            sql = f"DELETE FROM {table}"
            params = []
            clauses = []
            if req.record_id is not None:
                pk = TABLE_PK[table]
                clauses.append(f"{pk} = ?")
                params.append(req.record_id)
            if req.conditions:
                for cond in req.conditions:
                    col = cond.get("column")
                    if col not in TABLE_COLUMNS[table]:
                        raise ValueError(f"Unknown column {col}")
                    oper = cond.get("operator", "=")
                    clauses.append(f"{col} {oper} ?")
                    params.append(cond.get("value"))
            if clauses:
                sql += " WHERE " + " AND ".join(clauses)
            else:
                raise ValueError("DELETE requires a condition or record_id")
            cur = c.execute(sql, params)
            c.commit()
            return sql, params, cur.rowcount, None
        elif op == "join":
            if not req.join_table or req.join_table not in ALLOWED_TABLES:
                raise ValueError("join_table invalid")
            jt = req.join_table
            jtype = (req.join_type or "INNER").upper()
            if jtype not in ("INNER", "LEFT", "RIGHT"):
                jtype = "INNER"
            if jtype == "RIGHT":
                jtype = "RIGHT"  # sqlite supports
            on_clause = req.join_on
            if not on_clause:
                # default FK
                # find fk from table to join_table
                fk = None
                for f in FOREIGN_KEYS.get(table, []):
                    if f["ref_table"] == jt:
                        fk = f
                if not fk:
                    for f in FOREIGN_KEYS.get(jt, []):
                        if f["ref_table"] == table:
                            fk = {"column": f["ref_column"], "ref_table": table, "ref_column": f["column"]}
                if not fk:
                    raise ValueError("No join condition provided")
                on_clause = f"{table}.{fk['column']} = {jt}.{fk['ref_column']}"
            sql = f"SELECT * FROM {table} {jtype} JOIN {jt} ON {on_clause}"
            params = []
            # optional where user filter not needed
            cur = c.execute(sql)
            rows = [row_to_dict(r) for r in cur.fetchall()]
            return sql, params, len(rows), rows
        elif op == "aggregate":
            func = (req.aggregate_func or "COUNT").upper()
            if func not in ("COUNT", "SUM", "AVG", "MIN", "MAX"):
                raise ValueError("Unsupported aggregate")
            col = req.aggregate_column or "*"
            if col != "*" and col not in TABLE_COLUMNS[table]:
                raise ValueError("Unknown column")
            select = f"{func}({col}) AS result"
            group = req.group_by
            if group:
                if group not in TABLE_COLUMNS[table]:
                    raise ValueError("Unknown group column")
                select = f"{group}, {func}({col}) AS result"
            sql = f"SELECT {select} FROM {table}"
            params = []
            clauses = []
            if req.conditions:
                for cond in req.conditions:
                    colc = cond.get("column")
                    if colc not in TABLE_COLUMNS[table]:
                        raise ValueError(f"Unknown column {colc}")
                    oper = cond.get("operator", "=")
                    clauses.append(f"{colc} {oper} ?")
                    params.append(cond.get("value"))
            if clauses:
                sql += " WHERE " + " AND ".join(clauses)
            if group:
                sql += f" GROUP BY {group}"
            cur = c.execute(sql, params)
            rows = [row_to_dict(r) for r in cur.fetchall()]
            return sql, params, len(rows), rows
        else:
            raise ValueError("Unsupported operation")
    finally:
        if close:
            c.close()


def record_history(db_name, operation, preview, params, status, affected, duration, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        c.execute(
            "INSERT INTO query_history (database_name, operation, preview, parameters, status, affected_rows, duration_ms, created_at) VALUES (?,?,?,?,?,?,?,?)",
            (db_name, operation, preview, json.dumps(params) if params is not None else None, status, affected, duration, now_iso()),
        )
        c.commit()
        return c.execute("SELECT last_insert_rowid()").fetchone()[0]
    finally:
        if close:
            c.close()


def list_history(limit=50, conn=None):
    c = conn or get_connection()
    close = conn is None
    try:
        rows = c.execute("SELECT * FROM query_history ORDER BY history_id DESC LIMIT ?", (limit,)).fetchall()
        return [row_to_dict(r) for r in rows]
    finally:
        if close:
            c.close()
