from fastapi import APIRouter, HTTPException, Response, status

from app.api.deps import DB
from app.schemas.portfolio import PublicPortfolio
from app.services.portfolio import build_public_portfolio

router = APIRouter(prefix="/portfolio", tags=["public portfolio"])


@router.get("/{username}", response_model=PublicPortfolio)
def get_public_portfolio(username: str, response: Response, db: DB):
    """Public, unauthenticated. Unknown and unpublished usernames both return 404 so private accounts cannot be probed."""
    data = build_public_portfolio(db, username[:30])
    if data is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Portfolio not found or not published")
    response.headers["Cache-Control"] = "public, max-age=60"
    return data
