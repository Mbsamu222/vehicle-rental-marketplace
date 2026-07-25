from datetime import datetime, timezone

import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.exception_handlers import register_exception_handlers
from app.core.rate_limit import limiter

API_PREFIX = "/api/v1"


def create_app() -> FastAPI:
    app = FastAPI(title="Vehicle Rental Marketplace API")

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)
    app.add_middleware(SlowAPIMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        # Flutter web (`flutter run -d chrome`) launches each app on a random port,
        # so a fixed allowlist can't keep up in development.
        allow_origin_regex=None if settings.is_production else r"^https?://(localhost|127\.0\.0\.1):\d+$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware)

    register_exception_handlers(app)

    @app.get("/health")
    async def health() -> dict:
        return {"success": True, "status": "ok", "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")}

    _mount_routers(app)

    return app


def _rate_limit_handler(request, exc):
    from fastapi.responses import JSONResponse

    return JSONResponse(status_code=429, content={"success": False, "message": "Too many attempts, please try again later."})


def _mount_routers(app: FastAPI) -> None:
    from app.modules.admin.router import router as admin_router
    from app.modules.auth.router import router as auth_router
    from app.modules.bookings.router import router as bookings_router
    from app.modules.catalog.router import router as catalog_router
    from app.modules.coupons.router import router as coupons_router
    from app.modules.monetization.router import router as monetization_router
    from app.modules.notifications.router import router as notifications_router
    from app.modules.payments.router import router as payments_router
    from app.modules.payouts.router import router as payouts_router
    from app.modules.rental_partners.router import router as rental_partners_router
    from app.modules.reviews.router import router as reviews_router
    from app.modules.subscriptions.router import router as subscriptions_router
    from app.modules.support.router import router as support_router
    from app.modules.users.router import router as users_router
    from app.modules.vehicles.router import router as vehicles_router

    app.include_router(auth_router, prefix=f"{API_PREFIX}/auth", tags=["auth"])
    app.include_router(users_router, prefix=f"{API_PREFIX}/users", tags=["users"])
    app.include_router(catalog_router, prefix=f"{API_PREFIX}/catalog", tags=["catalog"])
    app.include_router(rental_partners_router, prefix=f"{API_PREFIX}/rental-partners", tags=["rental-partners"])
    app.include_router(vehicles_router, prefix=f"{API_PREFIX}/vehicles", tags=["vehicles"])
    app.include_router(bookings_router, prefix=f"{API_PREFIX}/bookings", tags=["bookings"])
    app.include_router(payments_router, prefix=f"{API_PREFIX}/payments", tags=["payments"])
    app.include_router(payouts_router, prefix=f"{API_PREFIX}/payouts", tags=["payouts"])
    app.include_router(monetization_router, prefix=f"{API_PREFIX}/monetization", tags=["monetization"])
    app.include_router(subscriptions_router, prefix=f"{API_PREFIX}/subscriptions", tags=["subscriptions"])
    app.include_router(reviews_router, prefix=f"{API_PREFIX}/reviews", tags=["reviews"])
    app.include_router(notifications_router, prefix=f"{API_PREFIX}/notifications", tags=["notifications"])
    app.include_router(coupons_router, prefix=f"{API_PREFIX}/coupons", tags=["coupons"])
    app.include_router(support_router, prefix=f"{API_PREFIX}/support-tickets", tags=["support"])
    app.include_router(admin_router, prefix=f"{API_PREFIX}/admin", tags=["admin"])


app = create_app()

# Combined ASGI entrypoint: python-socketio intercepts /socket.io/* and delegates
# everything else to the FastAPI app. Deploy this (`app.main:asgi_app`), not `app`
# directly, so realtime notifications work; `app` itself stays a plain FastAPI
# instance for testing/OpenAPI tooling.
from app.core.realtime import sio  # noqa: E402

asgi_app = socketio.ASGIApp(sio, other_asgi_app=app)
