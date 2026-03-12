from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Final, Iterable

from dotenv import load_dotenv

PROJECT_ROOT: Final[Path] = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")


def _first_non_empty_env(names: Iterable[str]) -> str | None:
    for name in names:
        value = os.getenv(name)
        if value is not None and value.strip() != "":
            return value
    return None


def _get_bool(names: Iterable[str], default: bool = False) -> bool:
    value = _first_non_empty_env(names)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _get_str(names: Iterable[str], default: str = "") -> str:
    value = _first_non_empty_env(names)
    if value is None:
        return default
    return value


@dataclass(frozen=True)
class Settings:
    """Runtime settings loaded from environment variables."""

    debug: bool
    bot_appid: str
    bot_secret: str
    version: str
    lxns_api_secret: str
    assets_url: str
    images_server_address: str
    default_avatar_url: str
    database_path: Path
    temp_folder: Path

    @classmethod
    def from_env(cls) -> "Settings":
        """Create immutable settings object from `.env` and process env."""
        return cls(
            debug=_get_bool(("MAIMAI_DEBUG", "DEBUG"), default=False),
            bot_appid=_get_str(("MAIMAI_BOT_APPID", "BOT_APPID"), ""),
            bot_secret=_get_str(("MAIMAI_BOT_SECRET", "BOT_SECRET"), ""),
            version=_get_str(("MAIMAI_BOT_VERSION", "BOT_VERSION"), "3.0-modern"),
            lxns_api_secret=_get_str(("MAIMAI_LXNS_API_SECRET", "LXNS_API_SECRET"), ""),
            assets_url=_get_str(
                ("MAIMAI_ASSETS_URL", "ASSETS_URL"),
                "https://assets2.lxns.net",
            ).rstrip("/"),
            images_server_address=_get_str(
                ("MAIMAI_IMAGE_SERVER_URL", "IMAGES_SERVER_ADDRESS"),
                "http://127.0.0.1:5000",
            ).rstrip("/"),
            default_avatar_url=_get_str(
                ("MAIMAI_DEFAULT_AVATAR_URL", "DEFAULT_AVATAR_URL"),
                "https://q1.qlogo.cn/g?b=qq&nk=0&s=640",
            ),
            database_path=Path(
                _get_str(
                    ("MAIMAI_DATABASE_PATH", "DATABASE_PATH"),
                    str(PROJECT_ROOT / "data" / "bot.db"),
                )
            ),
            temp_folder=Path(
                _get_str(("MAIMAI_TEMP_DIR", "TEMP_FOLDER"), str(PROJECT_ROOT / "tmp"))
            ),
        )


settings = Settings.from_env()

settings.database_path.parent.mkdir(parents=True, exist_ok=True)
settings.temp_folder.mkdir(parents=True, exist_ok=True)

# Backward-compatible exports
DEBUG = settings.debug
BOT_APPID = settings.bot_appid
BOT_SECRET = settings.bot_secret
VERSION = settings.version
LXNS_API_SECRET = settings.lxns_api_secret
ASSETS_URL = settings.assets_url
IMAGES_SERVER_ADDRESS = settings.images_server_address
DEFAULT_AVATAR_URL = settings.default_avatar_url
DATABASE_PATH = str(settings.database_path)
TEMP_FOLDER = str(settings.temp_folder)


class FontPaths:
    """Static font paths used by image rendering modules."""

    FONT_DIR: Final[Path] = PROJECT_ROOT / "static" / "fonts"
    MEIRYO: Final[Path] = FONT_DIR / "Meiryo.ttc"
    SIYUAN: Final[Path] = FONT_DIR / "Siyuan.otf"
    TORUS_BOLD: Final[Path] = FONT_DIR / "Torus SemiBold.otf"
    ZHIZI: Final[Path] = FONT_DIR / "ZhuZiAWan.ttc"
