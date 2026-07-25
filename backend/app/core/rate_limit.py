from slowapi import Limiter
from slowapi.util import get_remote_address

# Mirrors middleware/rateLimit.ts: a generous global default (apiLimiter) plus a
# tighter per-route override (auth_limit) applied explicitly to auth endpoints
# that mutate credentials (login/register/forgot-password/reset-password).
limiter = Limiter(key_func=get_remote_address, default_limits=["300/15 minutes"])

AUTH_RATE_LIMIT = "20/15 minutes"
