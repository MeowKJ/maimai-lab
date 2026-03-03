from __future__ import annotations

from typing import TYPE_CHECKING

import aiohttp
from botpy import logger

from ._types import Notes, SongDifficulty, SongDifficultyUtage, UserDifficultyScore
from .enums import SongType
from .maimai import MaimaiHelper

if TYPE_CHECKING:
    from .user import MaimaiUser


class Song:
    """Song entity with chart metadata and optional user score details."""

    def __init__(self, id: int) -> None:
        self.id = id
        self.song_type = self._resolve_song_type(id)
        self.title = ""
        self.artist = ""
        self.bpm = 0
        self.genre = ""
        self.version = ""
        self.disabled = False
        self.isnew = False
        self.has_re_master = False
        self._map = ""
        self.difficulties: list[SongDifficulty] = []
        self.difficulties_utage: SongDifficultyUtage | None = None

    @staticmethod
    def _resolve_song_type(song_id: int) -> SongType:
        if song_id < 10000:
            return SongType.STANDARD
        if song_id < 100000:
            return SongType.DX
        return SongType.UTAGE

    async def enrich(self) -> bool:
        """Load song metadata from LXNS public song API."""
        lxns_id = MaimaiHelper.common_to_lxns_songid(self.id)
        async with aiohttp.ClientSession() as session:
            async with session.get(f"https://maimai.lxns.net/api/v0/maimai/song/{lxns_id}") as response:
                if response.status != 200:
                    return False
                song_payload = await response.json()

        self.title = song_payload["title"]
        self.artist = song_payload["artist"]
        self.bpm = song_payload["bpm"]
        self.genre = song_payload["genre"]
        self.version = song_payload["version"]
        logger.info("[LMAIMAI] 歌曲信息: %s - %s", self.title, self.genre)
        if "map" in song_payload and self.song_type == SongType.DX:
            self._map = song_payload["map"]

        for song_info in song_payload["difficulties"][self.song_type.value]:
            notes = Notes(
                total=song_info["notes"]["total"],
                tap=song_info["notes"]["tap"],
                hold=song_info["notes"]["hold"],
                slide=song_info["notes"]["slide"],
                touch=song_info["notes"]["touch"],
                break_=song_info["notes"]["break"],
            )
            difficulty = SongDifficulty(
                level=song_info["level_value"],
                level_label=song_info["level"],
                level_index=song_info["difficulty"],
                note_designer=song_info["note_designer"],
                notes=notes,
            )
            self._append_difficulty(difficulty)
        return True

    def add_user_score(self, user_score: UserDifficultyScore) -> None:
        """Attach user score to matching chart difficulty."""
        for difficulty in self.difficulties:
            if difficulty.level_index == user_score.level_index:
                difficulty.user_score = user_score
                break

    async def enrich_all(self, user: MaimaiUser) -> bool:
        """Enrich song metadata and append user score details."""
        if not await self.enrich():
            return False
        await user.append_user_score(self)
        return True

    def _append_difficulty(self, difficulty: SongDifficulty) -> None:
        self.difficulties.append(difficulty)

    def __str__(self) -> str:
        return f"{self.id} - {self.title} - {self.genre}"

