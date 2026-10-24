import time
from typing import Any, Dict, List, Optional

from . import crud, nosql
from .database import get_connection


def log_activity(action, entity, details=None, db=None):
    try:
        from . import nosql as n
        n.insert_one("activity_logs", {
            "action": action,
            "entity": entity,
            "details": details or {},
            "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        }, db=db)
    except Exception:
        pass


def get_dashboard_summary(user_id):
    conn = get_connection()
    try:
        summary = crud.dashboard_summary(user_id, conn=conn)
        # monthly expenses by category for charts
        summary["spending_by_category"] = crud.spending_by_category(user_id, conn=conn)
        summary["monthly_trend"] = crud.monthly_trend(user_id, conn=conn)
        summary["budget_vs_actual"] = crud.budget_vs_actual(user_id, summary_month(), conn=conn)
        summary["alerts"] = crud.list_budget_alerts(user_id, conn=conn)
        return summary
    finally:
        conn.close()


def summary_month():
    import datetime as dt
    return dt.date.today().strftime("%Y-%m")


def get_insights(user_id):
    conn = get_connection()
    try:
        data = {
            "spending_by_category": crud.spending_by_category(user_id, conn=conn),
            "monthly_trend": crud.monthly_trend(user_id, conn=conn),
            "aggregate_stats": crud.aggregate_stats(user_id, conn=conn),
            "budget_vs_actual": crud.budget_vs_actual(user_id, summary_month(), conn=conn),
        }
    finally:
        conn.close()
    # mongo insights
    mongo_data = {}
    try:
        mongo_data["spending_insights"] = nosql.spending_insights_pipeline("financial_insights")
        mongo_data["anomalies"] = nosql.anomaly_detection_pipeline("financial_insights")
        mongo_data["budget_utilization"] = nosql.budget_utilization_pipeline("financial_insights")
        mongo_data["recent_activity"] = nosql.find("activity_logs", {}, 20)
    except Exception as e:
        mongo_data["error"] = str(e)
    data["mongo"] = mongo_data
    return data


def execute_sql(req_dict, user=None):
    from .models import SqlExecuteRequest
    user_id = user["user_id"] if user else None
    table = req_dict.get("table")
    # Enforce ownership for user-scoped tables
    if user_id is not None and table in ("transactions", "budgets"):
        op = req_dict.get("operation")
        if op == "insert":
            req_dict.setdefault("values", {})
            req_dict["values"]["user_id"] = user_id
        elif op in ("select", "aggregate"):
            req_dict.setdefault("conditions", [])
            if not any(c.get("column") == "user_id" for c in req_dict["conditions"]):
                req_dict["conditions"].append({"column": "user_id", "operator": "=", "value": user_id})
        elif op == "update":
            req_dict.setdefault("conditions", [])
            if not any(c.get("column") == "user_id" for c in req_dict["conditions"]):
                req_dict["conditions"].append({"column": "user_id", "operator": "=", "value": user_id})
        elif op == "delete":
            req_dict.setdefault("conditions", [])
            if not any(c.get("column") == "user_id" for c in req_dict["conditions"]):
                req_dict["conditions"].append({"column": "user_id", "operator": "=", "value": user_id})
    req = SqlExecuteRequest(**req_dict)
    conn = get_connection()
    start = time.perf_counter()
    try:
        sql, params, affected, rows = crud.execute_sql_structured(req, conn=conn)
        duration = (time.perf_counter() - start) * 1000
        hid = crud.record_history("sqlite", req.operation, sql, params, "success", affected, duration, conn=conn)
        conn.commit()
        # log activity
        log_activity("execute_sql", req.table, {"operation": req.operation, "affected": affected})
        return {
            "success": True,
            "database": "sqlite",
            "operation": req.operation,
            "preview": sql,
            "parameters": params,
            "affected_rows": affected,
            "duration_ms": round(duration, 3),
            "rows": rows,
            "history_id": hid,
        }
    except Exception as e:
        duration = (time.perf_counter() - start) * 1000
        try:
            crud.record_history("sqlite", req.operation if hasattr(req, 'operation') else "unknown", str(e), None, "error", 0, duration, conn=conn)
            conn.commit()
        except Exception:
            pass
        return {
            "success": False,
            "database": "sqlite",
            "operation": getattr(req, "operation", "unknown"),
            "preview": "",
            "parameters": None,
            "affected_rows": 0,
            "duration_ms": round(duration, 3),
            "rows": None,
            "error": str(e),
        }
    finally:
        conn.close()


def execute_mongo(req_dict, user=None):
    from .models import MongoExecuteRequest
    # scope activity_logs by clerk user if available
    if user and req_dict.get("collection") == "activity_logs":
        clerk_id = user.get("clerk_user_id") if isinstance(user, dict) else None
        if clerk_id:
            if req_dict.get("operation") == "insertOne":
                req_dict.setdefault("document", {})
                req_dict["document"].setdefault("clerk_user_id", clerk_id)
            elif req_dict.get("operation") in ("find", "updateOne", "deleteOne"):
                req_dict.setdefault("filter", {})
                req_dict["filter"].setdefault("clerk_user_id", clerk_id)
    req = MongoExecuteRequest(**req_dict)
    start = time.perf_counter()
    preview = f"db.{req.collection}.{req.operation}(...)"
    try:
        result = nosql.execute_mongo_structured(req)
        duration = (time.perf_counter() - start) * 1000
        # determine affected/rows
        affected = None
        rows = None
        if isinstance(result, list):
            rows = result
            affected = len(result)
        elif isinstance(result, int):
            affected = result
        elif isinstance(result, str):
            rows = [{"inserted_id": result}]
            affected = 1
        # history in sqlite
        conn = get_connection()
        try:
            params = {"filter": req.filter, "update": req.update, "document": req.document, "pipeline": req.pipeline}
            hid = crud.record_history("mongodb", req.operation, preview, params, "success", affected or 0, duration, conn=conn)
            conn.commit()
        finally:
            conn.close()
        log_activity("execute_mongo", req.collection, {"operation": req.operation})
        return {
            "success": True,
            "database": "mongodb",
            "operation": req.operation,
            "preview": preview,
            "parameters": None,
            "affected_rows": affected,
            "duration_ms": round(duration, 3),
            "rows": rows,
            "history_id": hid,
        }
    except Exception as e:
        duration = (time.perf_counter() - start) * 1000
        return {
            "success": False,
            "database": "mongodb",
            "operation": req.operation,
            "preview": preview,
            "parameters": None,
            "affected_rows": 0,
            "duration_ms": round(duration, 3),
            "rows": None,
            "error": str(e),
        }
