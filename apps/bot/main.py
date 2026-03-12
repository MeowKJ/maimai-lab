from __future__ import annotations

from pathlib import Path

import botpy
from botpy.logging import DEFAULT_FILE_HANDLER

from src.app.client import MyClient
from src.core.settings import settings


def _configure_log_file() -> None:
    log_file = Path.cwd() / "bot.log"
    DEFAULT_FILE_HANDLER["filename"] = str(log_file)


def _validate_required_settings() -> None:
    if not settings.bot_appid or not settings.bot_secret:
        raise RuntimeError(
            "Missing bot credentials. Set MAIMAI_BOT_APPID/MAIMAI_BOT_SECRET "
            "(or legacy BOT_APPID/BOT_SECRET) in apps/bot/.env."
        )


def main() -> None:
    _validate_required_settings()
    _configure_log_file()

    intents = botpy.Intents(public_guild_messages=True, public_messages=True)
    client = MyClient(
        intents=intents,
        is_sandbox=settings.debug,
        timeout=20,
        ext_handlers=DEFAULT_FILE_HANDLER,
    )
    client.run(appid=settings.bot_appid, secret=settings.bot_secret)


if __name__ == "__main__":
    main()
