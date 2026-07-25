import hashlib
import secrets


def generate_otp(length: int = 6) -> str:
    max_value = 10**length
    return str(secrets.randbelow(max_value)).zfill(length)


def generate_token(nbytes: int = 32) -> str:
    return secrets.token_hex(nbytes)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
