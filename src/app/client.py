from __future__ import annotations

from botpy import Client, logger
from botpy.message import GroupMessage, Message

from src.app.router import CommandMessage, CommandRouter
from src.features.b50.command import COMMANDS as B50_COMMANDS


class MyClient(Client):
    """QQ bot client that dispatches only B50-related commands."""

    def __init__(self, *args, **kwargs) -> None:
        """Initialize bot client and command router."""
        super().__init__(*args, **kwargs)
        self.router = CommandRouter(B50_COMMANDS)

    async def on_ready(self) -> None:
        """Hook called when bot connection is ready."""
        logger.info("[BOT] robot 「%s」 准备好了!", self.robot.name)
        logger.info(f"[BOT] Loaded B50 commands: {', '.join(sorted(B50_COMMANDS))}.")

    async def _dispatch_message(self, message: CommandMessage) -> None:
        """Resolve and dispatch one command message."""
        handler = self.router.resolve(message)
        if handler:
            await handler(message)

    async def on_at_message_create(self, message: Message) -> None:
        """Handle guild channel mentions."""
        logger.info(f"[BOT] Received message: {message.author.username}: {message.content}")
        await self._dispatch_message(message)

    async def on_group_at_message_create(self, message: GroupMessage) -> None:
        """Handle group channel mentions."""
        logger.info(
            f"[BOT] Received group message: {message.author.member_openid}: {message.content}"
        )
        await self._dispatch_message(message)
