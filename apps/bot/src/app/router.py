from __future__ import annotations

from dataclasses import dataclass
from typing import Awaitable, Callable, Mapping, TypeAlias

from botpy.message import GroupMessage, Message

CommandMessage: TypeAlias = Message | GroupMessage
CommandHandler: TypeAlias = Callable[[CommandMessage], Awaitable[None]]


@dataclass(frozen=True)
class ParsedCommand:
    """Structured command parsed from a raw chat message."""

    raw_content: str
    name: str


class CommandRouter:
    """Resolve incoming QQ bot messages into registered command handlers."""

    def __init__(self, command_map: Mapping[str, CommandHandler]) -> None:
        """Build a case-insensitive command map."""
        self._command_map = {name.lower(): handler for name, handler in command_map.items()}

    @staticmethod
    def extract_content(message: CommandMessage) -> str:
        """Extract plain command text from guild/group message payloads."""
        if isinstance(message, GroupMessage):
            return message.content.strip()

        # Channel messages usually look like "<@xxx> /command args"
        parts = message.content.split(">", maxsplit=1)
        if len(parts) == 2:
            return parts[1].strip()
        return message.content.strip()

    @staticmethod
    def parse(content: str) -> ParsedCommand | None:
        """Parse a command if content starts with `/`; otherwise return `None`."""
        if not content.startswith("/"):
            return None
        parts = content.split()
        if not parts or len(parts[0]) <= 1:
            return None
        return ParsedCommand(raw_content=content, name=parts[0][1:].lower())

    def resolve(self, message: CommandMessage) -> CommandHandler | None:
        """Resolve a message to a handler by command name."""
        content = self.extract_content(message)
        parsed = self.parse(content)
        if parsed is None:
            return None
        return self._command_map.get(parsed.name)
