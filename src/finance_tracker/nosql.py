import time
from typing import Any, Dict, List, Optional

ALLOWED_COLLECTIONS = {"activity_logs", "financial_insights"}


def _db(db=None):
    if db is not None:
        return db
    from .database import get_mongo_db
    return get_mongo_db()


def list_collections(db=None):
    d = _db(db)
    try:
        return sorted(d.list_collection_names())
    except Exception:
        return sorted(ALLOWED_COLLECTIONS)


def collection_stats(collection, db=None):
    d = _db(db)
    coll = d[collection]
    count = coll.count_documents({})
    sample = list(coll.find().limit(3))
    for s in sample:
        s["_id"] = str(s["_id"])
    indexes = []
    try:
        for idx in coll.list_indexes():
            indexes.append({"name": idx.get("name"), "keys": dict(idx.get("key", {}))})
    except Exception:
        pass
    return {"collection": collection, "count": count, "sample": sample, "indexes": indexes}


def insert_one(collection, document, db=None):
    if collection not in ALLOWED_COLLECTIONS:
        raise ValueError("Collection not allowed")
    d = _db(db)
    res = d[collection].insert_one(document)
    return str(res.inserted_id)


def find(collection, filter_doc=None, limit=50, db=None):
    if collection not in ALLOWED_COLLECTIONS:
        raise ValueError("Collection not allowed")
    d = _db(db)
    cursor = d[collection].find(filter_doc or {}).limit(limit)
    out = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        out.append(doc)
    return out


def update_one(collection, filter_doc, update, db=None):
    if collection not in ALLOWED_COLLECTIONS:
        raise ValueError("Collection not allowed")
    d = _db(db)
    res = d[collection].update_one(filter_doc or {}, update)
    return res.modified_count


def delete_one(collection, filter_doc, db=None):
    if collection not in ALLOWED_COLLECTIONS:
        raise ValueError("Collection not allowed")
    d = _db(db)
    res = d[collection].delete_one(filter_doc or {})
    return res.deleted_count


def aggregate(collection, pipeline, db=None):
    if collection not in ALLOWED_COLLECTIONS:
        raise ValueError("Collection not allowed")
    # safety: only allow certain stages
    allowed_stages = {"$match", "$group", "$sort", "$limit", "$project", "$count"}
    for stage in pipeline:
        for k in stage.keys():
            if k not in allowed_stages:
                raise ValueError(f"Disallowed stage {k}")
    d = _db(db)
    cur = d[collection].aggregate(pipeline)
    out = []
    for doc in cur:
        if "_id" in doc and not isinstance(doc["_id"], (str, int, float, bool, type(None))):
            doc["_id"] = str(doc["_id"])
        out.append(doc)
    return out


def spending_insights_pipeline(collection="financial_insights", db=None):
    pipeline = [
        {"$match": {}},
        {"$group": {"_id": "$category", "total": {"$sum": "$monthly_total"}}},
        {"$sort": {"total": -1}},
    ]
    return aggregate(collection, pipeline, db=db)


def anomaly_detection_pipeline(collection="financial_insights", db=None):
    pipeline = [
        {"$group": {"_id": "$category", "avg": {"$avg": "$monthly_total"}, "max": {"$max": "$monthly_total"}}},
        {"$project": {"category": "$_id", "avg": 1, "max": 1, "spike": {"$gt": ["$max", {"$multiply": ["$avg", 1.5]}]}}},
        {"$match": {"spike": True}},
    ]
    return aggregate(collection, pipeline, db=db)


def budget_utilization_pipeline(collection="financial_insights", db=None):
    # joins between mongo collections only; here financial_insights with activity_logs via $lookup
    pipeline = [
        {"$lookup": {"from": "activity_logs", "localField": "category", "foreignField": "category", "as": "logs"}},
        {"$project": {"category": 1, "monthly_total": 1, "log_count": {"$size": "$logs"}}},
    ]
    return aggregate(collection, pipeline, db=db)


def execute_mongo_structured(req, db=None):
    coll = req.collection
    if coll not in ALLOWED_COLLECTIONS:
        raise ValueError("Collection not allowed")
    op = req.operation
    d = _db(db)
    if op == "insertOne":
        doc = req.document or {}
        rid = insert_one(coll, doc, db=d)
        return rid
    elif op == "find":
        return find(coll, req.filter, req.limit or 50, db=d)
    elif op == "updateOne":
        return update_one(coll, req.filter or {}, req.update or {}, db=d)
    elif op == "deleteOne":
        return delete_one(coll, req.filter or {}, db=d)
    elif op == "aggregate":
        return aggregate(coll, req.pipeline or [], db=d)
    else:
        raise ValueError("Unsupported operation")
