from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .enums import FCType, FSType, SongLevelText, SongLevelTextMap, SongRateType, SongType


@dataclass(slots=True)
class UserInfo:
    """User profile summary returned by score-query platforms."""

    username: str
    avatar: str
    rating: int
    course_rank: int
    class_rank: int
    trophy: str
    nameplate_id: int = 0
    frame_id: int = 0


@dataclass(slots=True)
class UserDifficultyScore:
    """User score details for one difficulty chart."""

    level_index: int = 0
    achievements: float = 0.0
    rate: SongRateType = SongRateType.D
    rating: int = 0
    fc: FCType = FCType.NONE
    fs: FSType = FSType.NONE
    dx_score: int = 0


@dataclass(slots=True)
class Notes:
    """Note counts of one chart and helper methods for DX score max value."""

    total: int = 0
    tap: int = 0
    hold: int = 0
    slide: int = 0
    touch: int = 0
    break_: int = 0

    def __post_init__(self) -> None:
        if self.total == 0 and self.tap != 0:
            self.total = self.tap + self.hold + self.slide + self.touch + self.break_

    def calculate_dx_score(self) -> int:
        """Return chart max DX score (`note_total * 3`)."""
        return self.total * 3

    # Backward-compatible typo alias.
    def caculate_dx_score(self) -> int:
        """Backward-compatible alias for legacy callers."""
        return self.calculate_dx_score()

    def to_dict(self) -> dict[str, int]:
        """Serialize note counts to plain dict."""
        return {
            "total": self.total,
            "tap": self.tap,
            "hold": self.hold,
            "slide": self.slide,
            "touch": self.touch,
            "break": self.break_,
        }


@dataclass(slots=True)
class BuddyNotes:
    """Buddy chart note counts."""

    left: int = 0
    right: int = 0


def _resolve_song_type(song_id: int) -> SongType:
    if song_id < 10000:
        return SongType.STANDARD
    if song_id < 100000:
        return SongType.DX
    return SongType.UTAGE


def _resolve_level_label(level: float) -> str:
    floor_level = int(level)
    if level - floor_level > 0.6:
        return f"{floor_level}+"
    return str(floor_level)


def _resolve_level_text(level_index: int) -> SongLevelText:
    if 0 <= level_index < len(SongLevelTextMap):
        return SongLevelTextMap[level_index]
    return SongLevelText.BASIC


@dataclass(slots=True)
class SongDifficulty:
    """Chart metadata enriched with user score details."""

    id: int = 0
    title: str = ""
    level: float = 0.0
    level_index: int = 0
    song_type: SongType | None = None
    level_label: str = ""
    level_lable: str = ""  # legacy typo, kept for backward compatibility
    level_text: SongLevelText | None = None
    note_designer: str = "-"
    dx_rating_max: int = 0
    notes: Notes | None = None
    user_score: UserDifficultyScore | None = None

    def __post_init__(self) -> None:
        if self.song_type is None:
            self.song_type = _resolve_song_type(self.id)

        if not self.level_label and self.level_lable:
            self.level_label = self.level_lable
        if not self.level_lable and self.level_label:
            self.level_lable = self.level_label
        if not self.level_label:
            self.level_label = _resolve_level_label(self.level)
            self.level_lable = self.level_label

        if self.level_text is None:
            self.level_text = _resolve_level_text(self.level_index)

        if self.notes is not None and self.dx_rating_max == 0:
            self.dx_rating_max = self.notes.calculate_dx_score()

        if self.user_score is None:
            self.user_score = UserDifficultyScore(level_index=self.level_index)

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "SongDifficulty":
        """Construct a `SongDifficulty` from external JSON-like payload."""
        normalized = dict(payload)
        if "level_lable" in normalized and "level_label" not in normalized:
            normalized["level_label"] = normalized["level_lable"]
        return cls(**normalized)

    def get_dx_score_num(self) -> int:
        """Return DX badge tier from current/max DX score ratio (0-5)."""
        if not self.user_score or not self.dx_rating_max or not self.user_score.dx_score:
            return 0

        ratio = self.user_score.dx_score / self.dx_rating_max
        if ratio <= 0.85:
            return 0
        if ratio <= 0.90:
            return 1
        if ratio <= 0.93:
            return 2
        if ratio <= 0.95:
            return 3
        if ratio <= 0.97:
            return 4
        return 5


@dataclass(slots=True)
class SongDifficultyUtage:
    """Extra metadata for UTAGE charts."""

    kanji: str = ""
    description: str = ""
    is_buddy: bool = False
    notes: Notes | BuddyNotes = field(default_factory=Notes)

