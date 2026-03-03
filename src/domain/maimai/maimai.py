from __future__ import annotations

import math
import re
from typing import Final, Iterator

from .enums import MaimaiUserPlatform

GradeThreshold = tuple[str, float, float]

GRADE_THRESHOLDS: Final[tuple[GradeThreshold, ...]] = (
    ("SSS+", 100.5000, 22.4),
    ("SSS", 100.0000, 21.6),
    ("SS+", 99.5000, 21.1),
    ("SS", 99.0000, 20.8),
    ("S+", 98.0000, 20.3),
    ("S", 97.0000, 20.0),
)


class MaimaiHelper:
    """Pure helper methods for platform and song-id conversions."""

    QQ_ACCOUNT_PATTERN: Final[re.Pattern[str]] = re.compile(r"^\d{5,11}$")

    @staticmethod
    def guess_user_platform(account: str) -> int:
        """Guess platform from account format."""
        normalized = account.strip()
        if not normalized:
            raise ValueError("Account must not be empty.")
        if MaimaiHelper.QQ_ACCOUNT_PATTERN.fullmatch(normalized):
            return MaimaiUserPlatform.LXNS.value
        return MaimaiUserPlatform.DIVING_FISH.value

    @staticmethod
    def common_to_lxns_songid(song_id: int) -> int:
        """Convert common song id to LXNS id."""
        if 10000 <= song_id < 100000:
            return song_id % 10000
        return song_id

    @staticmethod
    def lxns_to_common_songid(song_id: int) -> int:
        """Convert LXNS song id to common id."""
        if 1000 <= song_id < 10000:
            return song_id + 10000
        return song_id

    @staticmethod
    def is_dx(song_id: int) -> bool:
        return 9999 < song_id < 100000

    @staticmethod
    def is_sd(song_id: int) -> bool:
        return song_id < 10000

    @staticmethod
    def is_utage(song_id: int) -> bool:
        return song_id > 99999

    @staticmethod
    def rating_generator(chart_constant: float) -> Iterator[tuple[str, int]]:
        """Yield (grade, dx_rating) pairs from SSS+ down to S."""
        for grade, min_rate, coefficient in GRADE_THRESHOLDS:
            dx_rating = math.floor(chart_constant * (min_rate / 100) * coefficient)
            yield grade, dx_rating

