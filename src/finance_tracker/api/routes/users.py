from fastapi import APIRouter, HTTPException
from ... import crud, models

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[models.UserOut])
def list_users():
    return crud.list_users()


@router.post("", response_model=models.UserOut)
def create_user(payload: models.UserCreate):
    uid = crud.create_user(payload.name, payload.email)
    return crud.get_user(uid)


@router.get("/{user_id}", response_model=models.UserOut)
def get_user(user_id: int):
    u = crud.get_user(user_id)
    if not u:
        raise HTTPException(404, "User not found")
    return u
