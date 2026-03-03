from __future__ import annotations

from typing import Literal

from botpy import logger
from botpy.message import GroupMessage, Message
from botpy.types.message import Reference

from src.core.settings import DEBUG, DEFAULT_AVATAR_URL
from src.infra.files.upload import upload_to_image_server

MessageType = Literal["group", "guild"]


class MixMessage:
    """Unified wrapper for guild and group message operations."""

    def __init__(self, message: GroupMessage | Message) -> None:
        """Wrap a raw QQ message and normalize read/reply fields."""
        self.message_reference = Reference(message_id=message.id)
        self.message_seq_id = 100 if DEBUG else 0

        if isinstance(message, GroupMessage):
            self.group_message: GroupMessage | None = message
            self.guild_message: Message | None = None
            self.user_id = message.author.member_openid
            self.avatar_url = DEFAULT_AVATAR_URL
            self.message_type: MessageType = "group"
        else:
            self.group_message = None
            self.guild_message = message
            self.user_id = message.author.id
            self.avatar_url = message.author.avatar
            self.message_type = "guild"

    async def reply(
        self, content: str = "", file_image: str = "", use_reference: bool = False
    ) -> None:
        """Reply to the wrapped message, supporting text and image."""
        if self.message_type == "guild":
            await self._reply_guild(content=content, file_image=file_image, use_reference=use_reference)
            return
        await self._reply_group(content=content, file_image=file_image)

    async def _reply_guild(self, content: str, file_image: str, use_reference: bool) -> None:
        """Reply in guild channel."""
        if self.guild_message is None:
            return
        if use_reference:
            await self.guild_message.reply(
                content=content,
                message_reference=self.message_reference,
            )
            return
        if file_image:
            await self.guild_message.reply(content=content, file_image=file_image)
            return
        await self.guild_message.reply(content=content)

    async def _reply_group(self, content: str, file_image: str) -> None:
        """Reply in group channel; image replies use configured image server."""
        if self.group_message is None:
            return
        if file_image:
            image_url = await upload_to_image_server(file_image)
            logger.info(f"[MixMSG] Uploaded image to SERVER: {image_url}")
            upload_media = await self.group_message._api.post_group_file(
                group_openid=self.group_message.group_openid,
                file_type=1,
                url=image_url,
                srv_send_msg=False,
            )
            await self.group_message._api.post_group_message(
                group_openid=self.group_message.group_openid,
                msg_type=7,
                msg_id=self.group_message.id,
                media=upload_media,
                msg_seq=self.message_seq_id,
                content=content,
            )
        else:
            await self.group_message._api.post_group_message(
                group_openid=self.group_message.group_openid,
                msg_id=self.group_message.id,
                msg_seq=self.message_seq_id,
                content=content,
            )
        self.message_seq_id += 1

    def _raw_content(self) -> str:
        """Get normalized raw content from wrapped message."""
        if self.message_type == "group":
            if self.group_message is None:
                return ""
            return self.group_message.content.strip()

        if self.guild_message is None:
            return ""
        parts = self.guild_message.content.split(">", maxsplit=1)
        if len(parts) == 2:
            return parts[1].strip()
        return self.guild_message.content.strip()

    def get_args(self, command: str = "", part_index: int = 1) -> str:
        """Extract command arguments by splitting with command prefix once."""
        message_content = self._raw_content()
        if not command:
            return message_content
        if command not in message_content:
            return message_content
        parts = message_content.split(command, maxsplit=1)
        if len(parts) <= part_index:
            return ""
        return parts[part_index].strip()
