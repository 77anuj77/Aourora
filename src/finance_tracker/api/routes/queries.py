from fastapi import APIRouter, Query, Depends
from ...auth import get_current_user
from ... import services, crud

router = APIRouter(prefix="/query", tags=["query"])


@router.post("/sql/execute")
def sql_execute(payload: dict, user=Depends(get_current_user)):
    return services.execute_sql(payload, user=user)


@router.post("/mongodb/execute")
def mongo_execute(payload: dict, user=Depends(get_current_user)):
    return services.execute_mongo(payload, user=user)


@router.get("/history")
def history(limit: int = Query(50), user=Depends(get_current_user)):
    return crud.list_history(limit)


@router.get("/history/{hid}")
def history_item(hid: int, user=Depends(get_current_user)):
    rows = crud.list_history(1000)
    for r in rows:
        if r["history_id"] == hid:
            return r
    return {"error": "not found"}
