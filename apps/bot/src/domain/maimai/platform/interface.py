from __future__ import annotations

from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any

from .._types import UserInfo

if TYPE_CHECKING:
    from ..song import Song


class Interface(ABC):
    """Abstract platform adapter for score query providers."""

    def __init__(self, id: str, platform_id: int) -> None:
        self.id = id
        self.platform_id = platform_id

    @abstractmethod
    async def fetch_user_info(self) -> UserInfo:
        """Fetch and return user profile data."""

    @abstractmethod
    async def append_user_score(self, song: "Song") -> "Song":
        """Enrich a song with user score details."""

    @abstractmethod
    async def fetch_best50_song_score(self) -> dict[str, Any]:
        """Fetch user profile and best-50 score payload."""
