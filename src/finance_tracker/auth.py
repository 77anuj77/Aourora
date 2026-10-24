import os
from fastapi import Depends, HTTPException, Request
from clerk_backend_api import Clerk
from clerk_backend_api.security.verifytoken import verify_token, TokenVerificationError
from clerk_backend_api.security.types import VerifyTokenOptions

from .database import get_connection
from . import crud

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
CLERK_PUBLISHABLE_KEY = os.getenv("CLERK_PUBLISHABLE_KEY")


def _verify(token: str) -> dict:
    if not CLERK_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Clerk secret key not configured")
    opts = VerifyTokenOptions(secret_key=CLERK_SECRET_KEY)
    try:
        return verify_token(token, opts)
    except TokenVerificationError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_token(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return auth.split(" ", 1)[1]


def get_current_clerk_user_id(token: str = Depends(get_token)) -> str:
    payload = _verify(token)
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token subject")
    return sub


def get_current_user(clerk_user_id: str = Depends(get_current_clerk_user_id)):
    conn = get_connection()
    try:
        user = crud.get_user_by_clerk(clerk_user_id, conn=conn)
        if not user:
            # try link by email from Clerk profile
            try:
                client = Clerk(bearer_auth=CLERK_SECRET_KEY)
                cu = client.users.get(user_id=clerk_user_id)
                emails = getattr(cu, "email_addresses", None) or []
                email = getattr(emails[0], "email_address", None) if emails else None
                if email:
                    # find existing seeded user by email
                    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
                    if row:
                        conn.execute("UPDATE users SET clerk_user_id = ? WHERE user_id = ?", (clerk_user_id, row["user_id"]))
                        conn.commit()
                        user = crud.get_user(row["user_id"], conn=conn)
            except Exception:
                pass
        if not user:
            # fetch from Clerk
            try:
                client = Clerk(bearer_auth=CLERK_SECRET_KEY)
                cu = client.users.get(user_id=clerk_user_id)
                name = " ".join(filter(None, [getattr(cu, "first_name", None), getattr(cu, "last_name", None)])) or "User"
                email = None
                emails = getattr(cu, "email_addresses", None) or []
                if emails:
                    email = getattr(emails[0], "email_address", None)
                if not email:
                    email = f"{clerk_user_id}@clerk.local"
            except Exception:
                name = "User"
                email = f"{clerk_user_id}@clerk.local"
            try:
                uid = crud.create_user(name, email, clerk_user_id=clerk_user_id, conn=conn)
                conn.commit()
                user = crud.get_user(uid, conn=conn)
            except Exception:
                conn.rollback()
                row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
                if row:
                    conn.execute("UPDATE users SET clerk_user_id = ? WHERE user_id = ?", (clerk_user_id, row["user_id"]))
                    conn.commit()
                    user = crud.get_user(row["user_id"], conn=conn)
        return user
    finally:
        conn.close()
