from fastapi import APIRouter, HTTPException, Query, Depends
from ...auth import get_current_user
from ... import crud, models, services

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("")
def list_budgets(user=Depends(get_current_user)):
    return crud.list_budgets(user["user_id"])


@router.post("")
def create_budget(payload: models.BudgetCreate, user=Depends(get_current_user)):
    data = payload.model_dump()
    data["user_id"] = user["user_id"]
    bid = crud.create_budget(data)
    services.log_activity("create_budget", "budgets", {"id": bid})
    return crud.get_budget(bid)


@router.get("/vs-actual")
def budget_vs_actual(month: str = Query(None), user=Depends(get_current_user)):
    import datetime as dt
    m = month or dt.date.today().strftime("%Y-%m")
    # ignore uid, use current user
    return crud.budget_vs_actual(user["user_id"], m)

@router.get("/{bid}")
def get_budget(bid: int, user=Depends(get_current_user)):
    b = crud.get_budget(bid)
    if not b or b["user_id"] != user["user_id"]:
        raise HTTPException(404, "Budget not found")
    return b


@router.put("/{bid}")
def update_budget(bid: int, payload: models.BudgetUpdate, user=Depends(get_current_user)):
    b = crud.get_budget(bid)
    if not b or b["user_id"] != user["user_id"]:
        raise HTTPException(404, "Budget not found")
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    rc = crud.update_budget(bid, data)
    if rc == 0:
        raise HTTPException(404, "Budget not found")
    return crud.get_budget(bid)


@router.delete("/{bid}")
def delete_budget(bid: int, user=Depends(get_current_user)):
    b = crud.get_budget(bid)
    if not b or b["user_id"] != user["user_id"]:
        raise HTTPException(404, "Budget not found")
    rc = crud.delete_budget(bid)
    if rc == 0:
        raise HTTPException(404, "Budget not found")
    return {"deleted": rc}




@router.get("/alerts/list")
def alerts(user=Depends(get_current_user)):
    return crud.list_budget_alerts(user["user_id"])
