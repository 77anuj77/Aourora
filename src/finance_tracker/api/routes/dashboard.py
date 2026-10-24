from fastapi import APIRouter, Query
from ... import services

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def summary(user_id: int = Query(1)):
    return services.get_dashboard_summary(user_id)
