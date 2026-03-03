from __future__ import annotations

from typing import TYPE_CHECKING, Any, Final

import aiohttp
from botpy import logger

from src.infra.assets import JSONType, assets

from .._types import SongDifficulty, UserDifficultyScore, UserInfo
from ..enums import FCType, FSType, SongRateType, SongType
from ..maimai import MaimaiHelper
from .interface import Interface

if TYPE_CHECKING:
    from ..song import Song

BASE_API: Final[str] = "https://www.diving-fish.com/api/maimaidxprober/query"


class DivingFishInterface(Interface):
    """Adapter for Diving Fish score API."""

    async def fetch_user_info(self) -> UserInfo:
        payload = await self._fetch_profile_payload()
        return self._build_user_info(payload)

    async def append_user_score(self, song: Song) -> Song:  # pragma: no cover - not used by B50 flow
        raise NotImplementedError("DivingFishInterface.append_user_score is not implemented.")

    async def fetch_best50_song_score(self) -> dict[str, UserInfo | list[SongDifficulty]]:
        payload = await self._fetch_profile_payload()
        user_info = self._build_user_info(payload)

        b15 = [self._build_song_entry(song_data) for song_data in payload["charts"]["dx"]]
        b35 = [self._build_song_entry(song_data) for song_data in payload["charts"]["sd"]]
        await self._enrich_chart_metadata(b15)
        await self._enrich_chart_metadata(b35)

        return {
            "user_info": user_info,
            "b15": b15,
            "b35": b35,
        }

    async def _fetch_profile_payload(self) -> dict[str, Any]:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{BASE_API}/player",
                json={"username": self.id, "b50": True},
            ) as response:
                if response.status != 200:
                    logger.error("[Fish] 用户信息获取失败: %s %s", self.id, response.status)
                    raise RuntimeError(f"Diving Fish API request failed: {response.status}")
                payload = await response.json()
                logger.info("[Fish] 用户信息获取成功: %s", self.id)
                return payload

    @staticmethod
    def _build_song_entry(song_data: dict[str, Any]) -> SongDifficulty:
        song_id = MaimaiHelper.common_to_lxns_songid(song_data["song_id"])
        score = UserDifficultyScore(
            level_index=song_data["level_index"],
            achievements=song_data["achievements"],
            rate=SongRateType.get_type_by_name(song_data["rate"]),
            rating=int(song_data["ra"]),
            fc=FCType.get_type_by_name(song_data["fc"]),
            fs=FSType.get_type_by_name(song_data["fs"]),
            dx_score=song_data["dxScore"],
        )
        chart = SongDifficulty(
            id=song_id,
            level=song_data["ds"],
            level_label=song_data["level"],
            level_index=song_data["level_index"],
            title=song_data["title"],
            song_type=SongType.get_type_by_name(song_data["type"]),
            user_score=score,
        )
        return chart

    @staticmethod
    def _build_user_info(payload: dict[str, Any]) -> UserInfo:
        return UserInfo(
            username=payload["nickname"],
            avatar="",
            rating=payload["rating"],
            course_rank=payload["additional_rating"] + 1,
            class_rank=0,
            trophy="",
            nameplate_id=0,
            frame_id=0,
        )

    @staticmethod
    async def _enrich_chart_metadata(charts: list[SongDifficulty]) -> None:
        raw_data = await assets.get_json(JSONType.LXNS_SONGS_INFO)
        songs = raw_data.get("songs", [])
        songs_by_id = {song["id"]: song for song in songs}

        for chart in charts:
            song_data = songs_by_id.get(chart.id)
            if not song_data:
                continue
            chart.dx_rating_max = (
                song_data["difficulties"][chart.song_type.value][chart.level_index]["notes"]["total"] * 3
            )
            chart.id = MaimaiHelper.lxns_to_common_songid(chart.id)
