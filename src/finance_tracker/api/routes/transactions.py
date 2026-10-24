import io
from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from fastapi.responses import PlainTextResponse
from ... import crud, models, utils, services

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("")
def list_transactions(user_id: int = Query(None), type: str = Query(None), category: str = Query(None),
                      date_from: str = Query(None), date_to: str = Query(None), search: str = Query(None)):
    filters = {"type": type, "category": category, "date_from": date_from, "date_to": date_to, "search": search}
    filters = {k: v for k, v in filters.items() if v is not None}
    return crud.list_transactions(user_id, filters=filters)


@router.get("/with-user")
def transactions_with_user(user_id: int = Query(None)):
    return crud.transactions_with_user(user_id)


@router.post("")
def create_transaction(payload: models.TransactionCreate):
    tid = crud.create_transaction(payload.model_dump())
    services.log_activity("create_transaction", "transactions", {"id": tid})
    return crud.get_transaction(tid)


@router.put("/{tid}")
def update_transaction(tid: int, payload: models.TransactionUpdate):
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    rc = crud.update_transaction(tid, data)
    if rc == 0:
        raise HTTPException(404, "Transaction not found")
    return crud.get_transaction(tid)


@router.delete("/{tid}")
def delete_transaction(tid: int):
    rc = crud.delete_transaction(tid)
    if rc == 0:
        raise HTTPException(404, "Transaction not found")
    return {"deleted": rc}


@router.post("/export")
def export_csv(user_id: int = Query(None)):
    csv_text = utils.export_transactions_csv(user_id)
    return PlainTextResponse(csv_text, media_type="text/csv")


@router.post("/import")
async def import_csv(file: UploadFile = File(None), csv_text: str = Query(None)):
    if file is not None:
        content = (await file.read()).decode("utf-8")
    elif csv_text is not None:
        content = csv_text
    else:
        # allow body text
        content = ""
    count = utils.import_transactions_csv(content)
    return {"imported": count}
