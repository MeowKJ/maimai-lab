"""
Legacy compatibility sample.

New architecture reads configuration from `.env` via `src/core/settings.py`.
If you still want a `config.py`, you can copy this file to `config.py`.
"""

from src.core.settings import (  # noqa: F401
    ASSETS_URL,
    BOT_APPID,
    BOT_SECRET,
    DATABASE_PATH,
    DEBUG,
    DEFAULT_AVATAR_URL,
    FontPaths,
    IMAGES_SERVER_ADDRESS,
    LXNS_API_SECRET,
    TEMP_FOLDER,
    VERSION,
)
