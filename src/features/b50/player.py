from __future__ import annotations

from dataclasses import dataclass, field
from typing import cast

from src.domain.maimai import MaimaiUser, SongDifficulty, UserInfo


@dataclass
class B50Player:
    """In-memory aggregate used by B50 rendering flow."""

    username: str
    guild_id: str
    favorite_id: int = 0
    avatar_url: str = ""
    song_data_b15: list[SongDifficulty] = field(default_factory=list)
    song_data_b35: list[SongDifficulty] = field(default_factory=list)
    user_info: UserInfo | None = None

    async def enrich(self, user: MaimaiUser) -> None:
        """Load B50 data from platform API and populate player fields."""
        data = await user.fetch_best50_song_score()
        self.song_data_b15 = cast(list[SongDifficulty], data["b15"])
        self.song_data_b35 = cast(list[SongDifficulty], data["b35"])
        self.user_info = cast(UserInfo, data["user_info"])
        if self.user_info and not self.user_info.avatar:
            self.user_info.avatar = self.avatar_url
