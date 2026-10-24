from fastapi import APIRouter, Depends
from ...auth import get_current_user
from ... import services

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(user=Depends(get_current_user)):
    return services.get_dashboard_summary(user["user_id"])
