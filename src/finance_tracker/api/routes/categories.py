from fastapi import APIRouter, Query, Depends
from pydantic import BaseModel
from ...auth import get_current_user
from ... import crud

router = APIRouter(prefix="/categories", tags=["categories"])


class CategoryCreate(BaseModel):
    name: str
    type: str


@router.get("")
def list_categories(type: str = Query(None), user=Depends(get_current_user)):
    return crud.list_categories(type)


@router.post("")
def create_category(payload: CategoryCreate, user=Depends(get_current_user)):
    cid = crud.create_category(payload.name, payload.type)
    return {"category_id": cid, "name": payload.name.strip(), "type": payload.type}
