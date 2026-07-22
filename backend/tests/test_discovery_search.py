import asyncio

import pytest

from app.schemas import PlaceResult
from app.services import discover_places


def place(external_id: str, category: str) -> PlaceResult:
    return PlaceResult(
        external_place_id=external_id,
        name=external_id,
        category=category,
        address="서울",
        latitude=37.5665,
        longitude=126.9780,
    )


@pytest.mark.asyncio
async def test_discovery_search_uses_only_nearest_first_page_and_keeps_partial_success():
    calls: list[tuple[str, int]] = []

    class PartiallySlowProvider:
        async def search(
            self,
            query,
            latitude,
            longitude,
            category=None,
            radius=None,
            page_count=1,
        ):
            calls.append((query, page_count))
            if query == "방탈출":
                await asyncio.sleep(0.05)
            return [place(query, category)]

    found, failed, total = await discover_places(
        PartiallySlowProvider(),
        ["게임·실내 놀거리"],
        37.5665,
        126.9780,
        2100,
        timeout_seconds=0.01,
    )

    assert total == 2
    assert failed == 1
    assert set(found) == {"보드게임카페"}
    assert calls == [("보드게임카페", 1), ("방탈출", 1)]


@pytest.mark.asyncio
async def test_discovery_search_reports_all_timeouts_without_caching_partial_pages():
    class SlowProvider:
        async def search(self, *_args, **_kwargs):
            await asyncio.sleep(0.05)
            return [place("late", "게임·실내 놀거리")]

    found, failed, total = await discover_places(
        SlowProvider(),
        ["게임·실내 놀거리"],
        37.5665,
        126.9780,
        2100,
        timeout_seconds=0.01,
    )

    assert found == {}
    assert failed == total == 2
