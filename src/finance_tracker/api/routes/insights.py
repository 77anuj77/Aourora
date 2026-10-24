from fastapi import APIRouter, Depends
from ...auth import get_current_user
from ... import services

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("")
def get_insights(user=Depends(get_current_user)):
    return services.get_insights(user["user_id"])
