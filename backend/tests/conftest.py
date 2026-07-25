"""Minimal test harness: an in-memory SQLite engine standing in for the real
Postgres database, and an httpx client wired directly to the FastAPI app.

SQLite (not Postgres) is used here because there is no Postgres available in
CI-less/local dev without docker-compose — tests should be runnable with zero
external services. This means anything relying on Postgres-only behavior
(native ENUM types, `gen_random_uuid()`, certain JSON operators) is not
exercised by this harness; the app itself still targets Postgres in
production (see app/db/session.py). Keep that gap in mind for anything
migration- or dialect-specific — this harness is for service/route logic.
"""
from collections.abc import AsyncIterator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.db.models as _models  # noqa: F401  registers all tables on Base.metadata
from app.db.base import Base
from app.db.session import get_db
from app.deps.auth import AuthUser, get_current_user
from app.main import app


@pytest_asyncio.fixture
async def db_session() -> AsyncIterator[AsyncSession]:
    engine = create_async_engine("sqlite+aiosqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False, autoflush=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncIterator[AsyncClient]:
    async def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


def login_as(user: AuthUser) -> None:
    """Call from a test to make subsequent `client` requests authenticate as
    `user`, bypassing Firebase token verification entirely."""
    app.dependency_overrides[get_current_user] = lambda: user
