"""Password hashing and signed session tokens using only the standard library."""

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Optional

AUTH_SECRET = os.getenv('AUTH_SECRET')
if not AUTH_SECRET:
    raise RuntimeError(
        'AUTH_SECRET belum diset. Isi di backend/.env dengan string acak panjang, '
        'mis. hasil: python -c "import secrets; print(secrets.token_urlsafe(48))"'
    )

TOKEN_TTL_SECONDS = 7 * 24 * 3600
_SCRYPT = dict(n=2**14, r=8, p=1, dklen=32)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, **_SCRYPT)
    return f'scrypt${salt.hex()}${digest.hex()}'


def verify_password(password: str, stored: Optional[str]) -> bool:
    try:
        scheme, salt_hex, digest_hex = (stored or '').split('$')
    except ValueError:
        return False
    if scheme != 'scrypt':
        return False
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex), **_SCRYPT)
    return hmac.compare_digest(digest.hex(), digest_hex)


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()


def _sign(body: str) -> str:
    return _b64(hmac.new(AUTH_SECRET.encode(), body.encode(), hashlib.sha256).digest())


def create_token(user_id: str, now: Optional[float] = None) -> str:
    now = time.time() if now is None else now
    body = _b64(json.dumps({'sub': user_id, 'exp': int(now) + TOKEN_TTL_SECONDS}).encode())
    return f'{body}.{_sign(body)}'


def read_token(token: str, now: Optional[float] = None) -> Optional[str]:
    """Return the user id for a valid, unexpired token, else None."""
    try:
        body, signature = token.split('.')
        if not hmac.compare_digest(signature, _sign(body)):
            return None
        claims = json.loads(base64.urlsafe_b64decode(body + '=' * (-len(body) % 4)))
    except (ValueError, TypeError):
        return None
    if claims.get('exp', 0) < (time.time() if now is None else now):
        return None
    return claims.get('sub')
