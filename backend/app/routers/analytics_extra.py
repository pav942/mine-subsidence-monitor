from fastapi import APIRouter, HTTPException
from app.services.correlation_service import compute_correlation_matrix, METRICS

router = APIRouter()


@router.get("/correlation")
def get_correlation():
    matrix = compute_correlation_matrix()
    if matrix is None:
        raise HTTPException(status_code=404, detail="Not enough data yet to compute correlation")
    return {"metrics": METRICS, "matrix": matrix}