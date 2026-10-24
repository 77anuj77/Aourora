from fastapi import APIRouter, Depends
from ...auth import get_current_user, get_current_clerk_user_id
from ... import crud

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
def me(user=Depends(get_current_user)):
    return user


@router.get("")
def list_users(user=Depends(get_current_user)):
    return [user]
