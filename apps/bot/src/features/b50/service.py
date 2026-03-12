from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Protocol

from src.domain.maimai.enums import MaimaiUserPlatform
from src.domain.maimai.maimai import MaimaiHelper

FISH = MaimaiUserPlatform.DIVING_FISH.value
LXNS = MaimaiUserPlatform.LXNS.value


PLATFORM_NAME = {
    FISH: "水鱼查分器",
    LXNS: "落雪咖啡屋",
}


class NotBoundError(Exception):
    """Raised when user has not bound a score account."""


class B50DataError(Exception):
    """Raised when fetching score data fails."""


class B50RenderError(Exception):
    """Raised when drawing image fails."""


@dataclass(frozen=True)
class BindOperationResult:
    platform_id: int
    platform_name: str
    display_name: str
    has_space: bool


@dataclass(frozen=True)
class B50RenderResult:
    image_path: str
    elapsed_seconds: float
    platform_id: int
    platform_name: str
    user_name: str


class UserRepositoryProtocol(Protocol):
    """Protocol for repository operations used by B50 service."""

    def add_or_update_user(self, user_id: str, name: str, platform_id: int) -> None: ...

    def get_user_by_id(self, user_id: str) -> "BindingProtocol": ...

    def update_user_score(self, user_id: str, new_score: int) -> None: ...


class BindingProtocol(Protocol):
    """Protocol for the user-binding record returned by repository."""

    name: str
    platform_id: int
    score: int
    favorite_id: int


class B50Service:
    """Application service for `/bind` and `/b50` business flow."""

    def __init__(self, repository: UserRepositoryProtocol | None = None) -> None:
        if repository is not None:
            self.repository = repository
            return
        from src.infra.database import user_repository

        self.repository = user_repository

    @staticmethod
    def _mask_lxns_account(account: str) -> str:
        """Mask QQ-like account to avoid leaking full identifiers."""
        if len(account) <= 4:
            return "*" * len(account)
        return f"{account[:2]}****{account[-2:]}"

    @staticmethod
    def parse_bind_content(content: str) -> tuple[str, int, bool]:
        """Parse bind input and infer platform when suffix is not provided."""
        content_list = [item for item in content.split(" ") if item]
        if not content_list:
            raise ValueError("请输入用户名或 QQ 号。")

        platform_id = -1
        platform_suffix = content_list[-1].lower()
        if platform_suffix == "f":
            platform_id = FISH
            content_list.pop()
        elif platform_suffix == "l":
            platform_id = LXNS
            content_list.pop()

        if not content_list:
            raise ValueError("请输入用户名或 QQ 号。")

        has_space = len(content_list) > 1
        user_name = " ".join(content_list)
        if platform_id < 0:
            platform_id = MaimaiHelper.guess_user_platform(user_name)
        return user_name, platform_id, has_space

    def bind_user(self, user_id: str, content: str) -> BindOperationResult:
        """Bind one QQ user to a score-query account."""
        user_name, platform_id, has_space = self.parse_bind_content(content)
        self.repository.add_or_update_user(
            user_id=user_id, name=user_name, platform_id=platform_id
        )
        display_name = (
            self._mask_lxns_account(user_name) if platform_id == LXNS else user_name
        )
        return BindOperationResult(
            platform_id=platform_id,
            platform_name=PLATFORM_NAME.get(platform_id, "未知平台"),
            display_name=display_name,
            has_space=has_space,
        )

    def get_binding(self, user_id: str) -> BindingProtocol:
        """Get user binding or raise domain-level not-bound error."""
        from src.infra.database.exceptions import (
            DatabaseOperationError,
            UserNotFoundError,
        )

        try:
            return self.repository.get_user_by_id(user_id)
        except UserNotFoundError as exc:
            raise NotBoundError("用户未绑定查分器账号。") from exc
        except DatabaseOperationError as exc:
            raise NotBoundError("查询绑定信息失败。") from exc

    async def render_b50(
        self,
        user_id: str,
        avatar_url: str,
        message_type: str,
    ) -> B50RenderResult:
        """Fetch score data and render B50 image to temporary file."""
        binding = self.get_binding(user_id)
        start_time = time.time()

        from src.domain.maimai.user import MaimaiUser
        from src.features.b50.player import B50Player

        player = B50Player(
            binding.name,
            user_id,
            favorite_id=binding.favorite_id,
            avatar_url=avatar_url,
        )

        try:
            maimai_player = MaimaiUser(id=binding.name, user_platform=binding.platform_id)
            await player.enrich(maimai_player)
        except Exception as exc:
            raise B50DataError(str(exc)) from exc

        try:
            from src.infra.files import TempFileManager
            from src.features.b50.draw import DrawBest

            draw_best = DrawBest(player)
            image = await draw_best.draw()
            temp_manager = TempFileManager()
            quality = 70 if message_type == "group" else 90
            temp_file, _ = temp_manager.create_temp_image_file(
                image, ".jpg", quality=quality
            )
        except Exception as exc:
            raise B50RenderError(str(exc)) from exc

        try:
            self.repository.update_user_score(user_id, player.user_info.rating)
        except Exception:
            # 分数写库失败不影响主流程，继续返回图片
            pass

        return B50RenderResult(
            image_path=temp_file,
            elapsed_seconds=time.time() - start_time,
            platform_id=binding.platform_id,
            platform_name=PLATFORM_NAME.get(binding.platform_id, "未知平台"),
            user_name=binding.name,
        )
