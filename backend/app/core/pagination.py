from collections.abc import Callable
from dataclasses import dataclass

from fastapi import Query


@dataclass
class Pagination:
    page: int
    limit: int

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.limit

    @property
    def take(self) -> int:
        return self.limit


def get_pagination(default_limit: int = 20, max_limit: int = 100) -> Callable[..., Pagination]:
    def dependency(
        page: int = Query(1, ge=1),
        limit: int = Query(default_limit, ge=1),
    ) -> Pagination:
        return Pagination(page=max(1, page), limit=min(max_limit, max(1, limit)))

    return dependency
