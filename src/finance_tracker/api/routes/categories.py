from fastapi import APIRouter, Query, Depends
from ...auth import get_current_user
from ... import crud

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("")
def list_categories(type: str = Query(None), user=Depends(get_current_user)):
    return {"categories": crud.list_categories(user["user_id"], type)}


@router.post("")
def create_category(payload: dict, user=Depends(get_current_user)):
    name = payload.get("name")
    type = payload.get("type", "expense")
    if not name:
        return {"error": "name required"}
    cid = crud.create_category(user["user_id"], name, type)
    return {"category_id": cid, "name": name, "type": type}
