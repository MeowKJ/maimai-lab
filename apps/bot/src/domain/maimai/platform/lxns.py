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

BASE_API: Final[str] = "https://maimai.lxns.net/api/v0/maimai"


class LxnsInterface(Interface):
    """Adapter for LXNS score API."""

    def __init__(self, id: str, platform_id: int, lxns_api: str) -> None:
        super().__init__(id, platform_id)
        self.lxns_api = lxns_api
        self.friend_code: str | None = None

    async def _get_friend_code(self) -> str | None:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                url=f"{BASE_API}/player/qq/{self.id}",
                headers={"Authorization": self.lxns_api},
            ) as response:
                if response.status != 200:
                    return None
                payload = await response.json()
                return str(payload["data"]["friend_code"])

    async def fetch_user_info(self) -> UserInfo:
        payload = await self._fetch_player_payload()
        return self._build_user_info(payload)

    async def append_user_score(self, song: Song) -> Song:
        if not self.friend_code:
            self.friend_code = await self._get_friend_code()
        if not self.friend_code:
            raise RuntimeError("Failed to resolve LXNS friend code.")

        if song.id < 10000:
            song_id = song.id
            song_type = SongType.STANDARD.value
        elif song.id < 100000:
            song_id = song.id % 10000
            song_type = SongType.DX.value
        else:
            song_id = song.id
            song_type = SongType.UTAGE.value

        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{BASE_API}/player/{self.friend_code}/bests/",
                headers={"Authorization": self.lxns_api},
                params={"song_id": song_id, "song_type": song_type},
            ) as response:
                if response.status != 200:
                    raise RuntimeError(f"LXNS score API failed: {response.status}")
                payload = await response.json()
                rows = payload["data"]

        for row in rows:
            score = UserDifficultyScore(
                level_index=row["level_index"],
                achievements=row["achievements"],
                dx_score=row["dx_score"],
                rating=int(row["dx_rating"]),
                rate=SongRateType.get_type_by_name(row["rate"]),
                fc=FCType.get_type_by_name(row["fc"]),
                fs=FSType.get_type_by_name(row["fs"]),
            )
            song.add_user_score(score)

        return song

    async def fetch_best50_song_score(self) -> dict[str, UserInfo | list[SongDifficulty] | int]:
        player_payload = await self._fetch_player_payload()
        self.friend_code = str(player_payload["friend_code"])
        user_info = self._build_user_info(player_payload)

        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{BASE_API}/player/{self.friend_code}/bests",
                headers={"Authorization": self.lxns_api},
            ) as response:
                if response.status != 200:
                    raise RuntimeError(f"LXNS bests API failed: {response.status}")
                payload = await response.json()
                data = payload["data"]
                logger.info("[LXNS] B50 成绩获取成功: %s", self.id)

        b35 = [self._build_chart_from_lxns_row(row) for row in data["standard"]]
        b15 = [self._build_chart_from_lxns_row(row) for row in data["dx"]]

        await self._enrich_chart_metadata(b15)
        await self._enrich_chart_metadata(b35)
        return {
            "user_info": user_info,
            "b15": b15,
            "b35": b35,
            "b15_total": data["dx_total"],
            "b35_total": data["standard_total"],
        }

    async def _fetch_player_payload(self) -> dict[str, Any]:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{BASE_API}/player/qq/{self.id}",
                headers={"Authorization": self.lxns_api},
            ) as response:
                if response.status != 200:
                    logger.error("[LXNS] 用户信息获取失败: %s %s", self.id, response.status)
                    raise RuntimeError(f"LXNS player API failed: {response.status}")
                payload = await response.json()
                data = payload["data"]
                logger.info("[LXNS] 用户信息获取成功: %s", self.id)
                return data

    @staticmethod
    def _build_user_info(data: dict[str, Any]) -> UserInfo:
        return UserInfo(
            username=data.get("name", "未知"),
            avatar=str(data.get("icon", {}).get("id", "")),
            rating=data.get("rating", 0),
            course_rank=data.get("course_rank", 0),
            class_rank=data.get("class_rank", 0),
            trophy=data.get("trophy", {}).get("name", ""),
            nameplate_id=data.get("name_plate", {}).get("id") or 0,
            frame_id=data.get("frame", {}).get("id") or 0,
        )

    @staticmethod
    def _build_chart_from_lxns_row(row: dict[str, Any]) -> SongDifficulty:
        score = UserDifficultyScore(
            level_index=row["level_index"],
            achievements=row["achievements"],
            dx_score=row["dx_score"],
            rating=int(row["dx_rating"]),
            rate=SongRateType.get_type_by_name(row["rate"]),
            fc=FCType.get_type_by_name(row["fc"]),
            fs=FSType.get_type_by_name(row["fs"]),
        )
        return SongDifficulty(
            id=row["id"],
            level_label=row["level"],
            level_index=row["level_index"],
            song_type=SongType.get_type_by_name(row["type"]),
            title=row["song_name"],
            user_score=score,
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
            chart.level = song_data["difficulties"][chart.song_type.value][chart.level_index]["level_value"]
            chart.dx_rating_max = (
                song_data["difficulties"][chart.song_type.value][chart.level_index]["notes"]["total"] * 3
            )
            chart.id = MaimaiHelper.lxns_to_common_songid(chart.id)

