from __future__ import annotations

from typing import TypeAlias

from src.core.settings import LXNS_API_SECRET

from ._types import SongDifficulty, UserInfo
from .enums import MaimaiUserPlatform
from .platform import DivingFishInterface, LxnsInterface
from .song import Song

Best50Payload: TypeAlias = dict[str, UserInfo | list[SongDifficulty]]
MaimaiInterface: TypeAlias = DivingFishInterface | LxnsInterface


class MaimaiUser:
    """Facade object that routes requests to the configured score platform."""

    def __init__(self, id: str, user_platform: int) -> None:
        self.id = id
        self.user_platform = user_platform
        self.interface = self._initialize_interface(user_platform)

    def _initialize_interface(self, user_platform: int) -> MaimaiInterface:
        if user_platform == MaimaiUserPlatform.DIVING_FISH.value:
            return DivingFishInterface(self.id, user_platform)
        if user_platform == MaimaiUserPlatform.LXNS.value:
            return LxnsInterface(self.id, user_platform, LXNS_API_SECRET)
        raise ValueError("Invalid user platform.")

    async def append_user_score(self, song: Song) -> Song:
        """Append score details into one song object."""
        return await self.interface.append_user_score(song)

    async def fetch_best50_song_score(self) -> Best50Payload:
        """Fetch user profile plus B35/B15 chart entries."""
        return await self.interface.fetch_best50_song_score()

    async def fetch_user_info(self) -> UserInfo:
        """Fetch user profile only."""
        return await self.interface.fetch_user_info()

    def __str__(self) -> str:
        return self.id
