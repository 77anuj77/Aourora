from fastapi import APIRouter, Query
from ... import services, crud, models

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/{uid}")
def get_insights(uid: int):
    return services.get_insights(uid)


@router.get("/dashboard/summary")
def dashboard_summary(user_id: int = Query(1)):
    return services.get_dashboard_summary(user_id)
