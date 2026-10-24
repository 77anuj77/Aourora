from fastapi import APIRouter, HTTPException, Query
from ... import crud, models, services

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("")
def list_budgets(user_id: int = Query(None)):
    return crud.list_budgets(user_id)


@router.post("")
def create_budget(payload: models.BudgetCreate):
    bid = crud.create_budget(payload.model_dump())
    services.log_activity("create_budget", "budgets", {"id": bid})
    return crud.get_budget(bid)


@router.get("/{bid}")
def get_budget(bid: int):
    b = crud.get_budget(bid)
    if not b:
        raise HTTPException(404, "Budget not found")
    return b


@router.put("/{bid}")
def update_budget(bid: int, payload: models.BudgetUpdate):
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    rc = crud.update_budget(bid, data)
    if rc == 0:
        raise HTTPException(404, "Budget not found")
    return crud.get_budget(bid)


@router.delete("/{bid}")
def delete_budget(bid: int):
    rc = crud.delete_budget(bid)
    if rc == 0:
        raise HTTPException(404, "Budget not found")
    return {"deleted": rc}


@router.get("/{uid}/vs-actual")
def budget_vs_actual(uid: int, month: str = Query(None)):
    import datetime as dt
    m = month or dt.date.today().strftime("%Y-%m")
    return crud.budget_vs_actual(uid, m)


@router.get("/alerts/list")
def alerts(user_id: int = Query(None)):
    return crud.list_budget_alerts(user_id)
