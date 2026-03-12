from __future__ import annotations

from enum import Enum
from typing import Final


class MaimaiUserPlatform(Enum):
    """Supported score-query platforms."""

    DIVING_FISH = 0
    LXNS = 1


class SongType(Enum):
    """Song chart families used by maimai APIs."""

    STANDARD = "standard"
    DX = "dx"
    UTAGE = "utage"

    @classmethod
    def get_type_by_name(cls, name: str) -> "SongType":
        """Convert API song-type text to enum; defaults to `STANDARD`."""
        normalized = name.strip().lower()
        if normalized in {"standard", "std", "sd"}:
            return cls.STANDARD
        if normalized == "dx":
            return cls.DX
        if normalized == "utage":
            return cls.UTAGE
        return cls.STANDARD


class SongLevelText(Enum):
    """Text labels shown for chart difficulty levels."""

    BASIC = "BASIC"
    ADVANCED = "ADVANCED"
    EXPERT = "EXPERT"
    MASTER = "MASTER"
    RE_MASTER = "Re:MASTER"


class SongLevel(Enum):
    """Difficulty indexes used by upstream APIs."""

    BASIC = 0
    ADVANCED = 1
    EXPERT = 2
    MASTER = 3
    RE_MASTER = 4


SongLevelTextMap: Final[list[SongLevelText]] = [
    SongLevelText.BASIC,
    SongLevelText.ADVANCED,
    SongLevelText.EXPERT,
    SongLevelText.MASTER,
    SongLevelText.RE_MASTER,
]


class SongRateType(Enum):
    """Achievement rank types."""

    SSS_PLUS = "sssp"
    SSS = "sss"
    SS_PLUS = "ssp"
    SS = "ss"
    S_PLUS = "sp"
    S = "s"
    AAA = "aaa"
    AA = "aa"
    A = "a"
    BBB = "bbb"
    BB = "bb"
    B = "b"
    C = "c"
    D = "d"

    @classmethod
    def get_type_by_name(cls, name: str) -> "SongRateType":
        """Convert rank text to enum; unknown values map to `D`."""
        return next((item for item in cls if item.value == name), cls.D)


class FSType(Enum):
    """Full sync achievement types."""

    FULL_SNYC = "fs"
    FULL_SNYC_PLUS = "fsp"
    FULL_SYNC_DX = "fsd"
    FULL_SYNC_DX_PLUS = "fsdp"
    SYNC = "sync"
    NONE = ""

    @classmethod
    def get_type_by_name(cls, name: str) -> "FSType":
        """Convert fs text to enum; unknown values map to `NONE`."""
        return next((item for item in cls if item.value == name), cls.NONE)


class FCType(Enum):
    """Full combo achievement types."""

    FULL_COMBO = "fc"
    FULL_COMBO_PLUS = "fcp"
    ALL_PERFECT = "ap"
    ALL_PERFECT_PLUS = "app"
    NONE = ""

    @classmethod
    def get_type_by_name(cls, name: str) -> "FCType":
        """Convert fc text to enum; unknown values map to `NONE`."""
        return next((item for item in cls if item.value == name), cls.NONE)

