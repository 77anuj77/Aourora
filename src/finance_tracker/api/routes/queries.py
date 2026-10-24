from fastapi import APIRouter, Query
from ... import services, crud, models

router = APIRouter(prefix="/query", tags=["query"])


@router.post("/sql/execute")
def sql_execute(payload: dict):
    return services.execute_sql(payload)


@router.post("/sql/preview")
def sql_preview(payload: dict):
    # reuse generation by calling crud? Just return same generated without execute? We'll execute generation only.
    return {"note": "preview generated client-side via execute? use execute"}


@router.post("/mongodb/execute")
def mongo_execute(payload: dict):
    return services.execute_mongo(payload)


@router.get("/history")
def history(limit: int = Query(50)):
    return crud.list_history(limit)


@router.get("/history/{hid}")
def history_item(hid: int):
    rows = crud.list_history(1000)
    for r in rows:
        if r["history_id"] == hid:
            return r
    return {"error": "not found"}
