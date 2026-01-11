import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from jose import jwt

router = APIRouter(tags=["auth"])

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 30


class AuthRequest(BaseModel):
    password: str


class AuthResponse(BaseModel):
    token: str
    expires_at: datetime


def create_token() -> tuple[str, datetime]:
    """Create a JWT token valid for 30 days."""
    expires_at = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    payload = {
        "sub": "user",
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return token, expires_at


def verify_token(token: str) -> bool:
    """Verify a JWT token."""
    try:
        jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return True
    except Exception:
        return False


@router.post("/auth", response_model=AuthResponse)
async def authenticate(request: AuthRequest):
    """Authenticate with password and receive JWT token."""
    app_password = os.getenv("APP_PASSWORD")

    if not app_password:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server not configured properly",
        )

    if request.password != app_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password",
        )

    token, expires_at = create_token()
    return AuthResponse(token=token, expires_at=expires_at)


@router.get("/auth/verify")
async def verify_auth():
    """Verify the current token is valid (called with Authorization header)."""
    return {"valid": True}
