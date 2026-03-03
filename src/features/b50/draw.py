from __future__ import annotations

import asyncio
import random
from collections import OrderedDict
from pathlib import Path
from typing import TypeAlias

from PIL import Image, ImageDraw, ImageFont

from src.core.settings import FontPaths, VERSION
from src.domain.maimai import SongDifficulty, SongRateType
from src.infra.assets import AssetType, assets
from src.presentation.images.alpha import (
    adjust_image_alpha,
    add_rounded_corners_to_image,
    deepen_image_color,
)
from src.presentation.images.components.user_info import draw_user_info

from .basic import fcl, fsl, score_Rank_l
from .image import DrawText
from .player import B50Player

CacheKey: TypeAlias = tuple[str, str, tuple[int, int] | None, float | None]


class Draw:
    """Shared drawing base class with heavy image caching."""

    MAX_SHARED_CACHE_ITEMS = 600
    SHARED_IMAGE_CACHE: OrderedDict[CacheKey, Image.Image] = OrderedDict()

    PRISM_RATE_TYPES = {
        SongRateType.S,
        SongRateType.S_PLUS,
        SongRateType.SS,
        SongRateType.SS_PLUS,
        SongRateType.SSS,
        SongRateType.SSS_PLUS,
    }

    def __init__(self, image: Image.Image | None = None) -> None:
        if image is None:
            raise ValueError("Draw requires a base image.")
        self._im = image
        dr = ImageDraw.Draw(self._im)
        self._mr = DrawText(dr, FontPaths.MEIRYO)
        self._sy = DrawText(dr, FontPaths.SIYUAN)
        self._tb = DrawText(dr, FontPaths.TORUS_BOLD)

        self.basic = Image.open(
            assets.get(AssetType.IMAGES, "b50_score_basic")
        ).convert("RGBA")
        self.advanced = Image.open(
            assets.get(AssetType.IMAGES, "b50_score_advanced")
        ).convert("RGBA")
        self.expert = Image.open(
            assets.get(AssetType.IMAGES, "b50_score_expert")
        ).convert("RGBA")
        self.master = Image.open(
            assets.get(AssetType.IMAGES, "b50_score_master")
        ).convert("RGBA")
        self.remaster = Image.open(
            assets.get(AssetType.IMAGES, "b50_score_remaster")
        ).convert("RGBA")

        self.title_bg = (
            Image.open(assets.get(AssetType.IMAGES, "title2"))
            .convert("RGBA")
            .resize((600, 120))
        )
        self.design_bg = (
            Image.open(assets.get(AssetType.IMAGES, "design"))
            .convert("RGBA")
            .resize((1320, 120))
        )

        self._diff = [
            self.basic,
            self.advanced,
            self.expert,
            self.master,
            self.remaster,
        ]

        alpha = 0.6

        for i in range(5):
            img = deepen_image_color(self._diff[i], 1.5)
            self._diff[i] = adjust_image_alpha(img, alpha)

    def _cache_key(
        self,
        asset_type: AssetType,
        asset_name: str,
        size: tuple[int, int] | None,
        deepen_factor: float | None,
    ) -> CacheKey:
        return (asset_type.name, str(asset_name), size, deepen_factor)

    @staticmethod
    def _open_rgba(path: str, size: tuple[int, int] | None) -> Image.Image:
        with Image.open(path) as raw:
            image = raw.convert("RGBA")
        if size is not None:
            image = image.resize(size)
        return image

    @classmethod
    def _get_shared_cached_image(cls, key: CacheKey) -> Image.Image | None:
        image = cls.SHARED_IMAGE_CACHE.get(key)
        if image is None:
            return None
        cls.SHARED_IMAGE_CACHE.move_to_end(key)
        return image

    @classmethod
    def _set_shared_cached_image(
        cls,
        key: CacheKey,
        image: Image.Image,
    ) -> None:
        cls.SHARED_IMAGE_CACHE[key] = image
        cls.SHARED_IMAGE_CACHE.move_to_end(key)
        if len(cls.SHARED_IMAGE_CACHE) > cls.MAX_SHARED_CACHE_ITEMS:
            cls.SHARED_IMAGE_CACHE.popitem(last=False)

    def _get_cached_sync_image(
        self,
        asset_type: AssetType,
        asset_name: str,
        size: tuple[int, int] | None = None,
        deepen_factor: float | None = None,
    ) -> Image.Image:
        key = self._cache_key(asset_type, asset_name, size, deepen_factor)
        cached = self._get_shared_cached_image(key)
        if cached is not None:
            return cached

        image = self._open_rgba(assets.get(asset_type, asset_name), size)
        if deepen_factor is not None:
            image = deepen_image_color(image, deepen_factor)
        self._set_shared_cached_image(key, image)
        return image

    async def _get_cached_async_image(
        self,
        asset_type: AssetType,
        asset_name: str,
        size: tuple[int, int] | None = None,
        deepen_factor: float | None = None,
        fallback: tuple[AssetType, str] | None = None,
    ) -> Image.Image | None:
        key = self._cache_key(asset_type, asset_name, size, deepen_factor)
        cached = self._get_shared_cached_image(key)
        if cached is not None:
            return cached

        path = await assets.get_async(asset_type, asset_name)
        if not path or not Path(path).exists():
            if fallback is None:
                return None
            fallback_type, fallback_name = fallback
            return await self._get_cached_async_image(
                fallback_type,
                fallback_name,
                size=size,
                deepen_factor=deepen_factor,
                fallback=None,
            )

        image = self._open_rgba(path, size)
        if deepen_factor is not None:
            image = deepen_image_color(image, deepen_factor)
        self._set_shared_cached_image(key, image)
        return image

    def _get_cached_path_image(
        self,
        path: str,
        size: tuple[int, int] | None = None,
    ) -> Image.Image | None:
        if not path or not Path(path).exists():
            return None

        key = ("PATH", path, size, None)
        cached = self._get_shared_cached_image(key)
        if cached is not None:
            return cached

        image = self._open_rgba(path, size)
        self._set_shared_cached_image(key, image)
        return image

    async def whiledraw(
        self,
        data: list[SongDifficulty],
        best: bool,
    ) -> None:

        # y为第一排纵向坐标，dy为各排间距
        dy = 170
        y = 430 if best else 1700

        TEXT_COLOR = [
            (255, 255, 255, 255),
            (255, 255, 255, 255),
            (255, 255, 255, 255),
            (255, 255, 255, 255),
            (138, 0, 226, 255),
        ]
        x = 70

        # 预取封面路径，避免逐曲串行等待。
        cover_paths = await asyncio.gather(
            *[assets.get_async(AssetType.COVER, info.id) for info in data]
        )

        for num, info in enumerate(data):
            if num % 5 == 0:
                x = 70
                y += dy if num != 0 else 0
            else:
                x += 416

            cover_path = cover_paths[num]
            if not cover_path or not Path(cover_path).exists():
                cover = await self._get_cached_async_image(
                    AssetType.COVER, "0", size=(135, 135)
                )
            else:
                cover = self._get_cached_path_image(cover_path, (135, 135))

            version = await self._get_cached_async_image(
                AssetType.IMAGES,
                f"{info.song_type.value}.png",
                size=(55, 19),
            )

            # rate s sp ss ssp sss和sss+的使用prism样式
            rate = None
            if info.user_score.rate:
                if info.user_score.rate in self.PRISM_RATE_TYPES:
                    rate = await self._get_cached_async_image(
                        AssetType.PRISM,
                        f"{info.user_score.rate.value}.png",
                        size=(95, 44),
                        deepen_factor=2,
                    )
                else:
                    rate = await self._get_cached_async_image(
                        AssetType.IMAGES,
                        f"UI_TTR_Rank_{score_Rank_l[info.user_score.rate.value]}.png",
                        size=(110, 44),
                    )
            self._im.alpha_composite(self._diff[info.level_index], (x, y))
            if cover is not None:
                self._im.alpha_composite(cover, (x + 5, y + 5))
            if version is not None:
                self._im.alpha_composite(version, (x + 80, y + 141))
            if rate is not None:
                self._im.alpha_composite(rate, (x + 150, y + 98))
            if info.user_score.fc.value:
                fc = await self._get_cached_async_image(
                    AssetType.IMAGES,
                    f"UI_MSS_MBase_Icon_{fcl[info.user_score.fc.value]}.png",
                    size=(45, 45),
                )
                if fc is not None:
                    self._im.alpha_composite(fc, (x + 246, y + 99))
            if info.user_score.fs.value:
                fs = await self._get_cached_async_image(
                    AssetType.IMAGES,
                    f"UI_MSS_MBase_Icon_{fsl[info.user_score.fs.value]}.png",
                    size=(45, 45),
                )
                if fs is not None:
                    self._im.alpha_composite(fs, (x + 291, y + 99))

            dxnum = info.get_dx_score_num()

            if dxnum:
                dx_icon = await self._get_cached_async_image(
                    AssetType.IMAGES,
                    f"UI_GAM_Gauge_DXScoreIcon_0{dxnum}.png",
                )
                if dx_icon is not None:
                    self._im.alpha_composite(dx_icon, (x + 335, y + 102))

            self._tb.draw(
                x + 40,
                y + 148,
                20,
                info.id,
                TEXT_COLOR[info.level_index],
                anchor="mm",
            )
            title = info.title
            if column_width(title) > 19:
                title = change_column_width(title, 18) + "..."
            self._sy.draw(
                x + 155, y + 20, 20, title, TEXT_COLOR[info.level_index], anchor="lm"
            )
            self._tb.draw(
                x + 155,
                y + 50,
                32,
                f"{info.user_score.achievements:.4f}%",
                TEXT_COLOR[info.level_index],
                anchor="lm",
            )

            dxsocre_text = (
                f"{info.user_score.dx_score}/{info.dx_rating_max}"
                if info.user_score.dx_score
                else str(info.dx_rating_max)
            )
            self._tb.draw(
                x + 338,
                y + 82,
                20,
                dxsocre_text,
                TEXT_COLOR[info.level_index],
                anchor="mm",
            )
            self._tb.draw(
                x + 155,
                y + 82,
                22,
                f"{info.level} -> {info.user_score.rating}",
                TEXT_COLOR[info.level_index],
                anchor="lm",
            )


class DrawBest(Draw):
    """Concrete B50 renderer."""

    def __init__(self, b50player: B50Player) -> None:

        background_image = random.choices(
            ["b50_bg1-min.png", "b50_bg2-min.png", "b50_bg3-min.png"],
            weights=[80, 10, 10],
            k=1,
        )[0]

        super().__init__(
            Image.open(assets.get(AssetType.PRISM, background_image)).convert("RGBA")
        )
        self.b50player = b50player

    async def draw(self) -> Image.Image:

        # 绘制用户信息板子
        default_plate_list = [
            await assets.get_async(AssetType.PRISM, f"p{i}-min.png")
            for i in range(1, 4)
        ]

        default_avatar_list = [
            await assets.get_async(AssetType.PRISM, f"logo{i}.png") for i in range(1, 6)
        ]

        sdrating, dxrating = sum(
            [_.user_score.rating for _ in self.b50player.song_data_b35]
        ), sum([_.user_score.rating for _ in self.b50player.song_data_b15])

        user_info_image = await draw_user_info(
            self.b50player.user_info,
            f"B35: {sdrating} + B15: {dxrating} = {self.b50player.user_info.rating}",
            random.choice(default_plate_list),
            random.choice(default_avatar_list),
        )

        self._im.alpha_composite(user_info_image, (500, 100))
        # 绘制徽章
        if self.b50player.favorite_id == 0:
            self.b50player.favorite_id = random.randint(1, 17)

        logo = self._get_cached_sync_image(
            AssetType.ONGEKI,
            f"ongeki{self.b50player.favorite_id}.png",
            size=(int(220 * 1.2), int(290 * 1.2)),
        )
        self._im.alpha_composite(logo, (130, 25))

        # 绘制底部信息
        footer_text_1 = f"Generated by Maimai Channel BOT [{VERSION}]"
        footer_text_2 = f"Designed by Komo | Maimai的频道 | 频道号: 82f4ywfvrm"
        self._mr.draw(
            490,
            2465,
            35,
            footer_text_2,
            (0, 50, 100, 255),
            "mm",
            3,
            (255, 255, 255, 255),
            font=ImageFont.truetype(FontPaths.ZHIZI, 35),
        )

        self._mr.draw(
            1750,
            2465,
            35,
            footer_text_1,
            (0, 50, 100, 255),
            "mm",
            3,
            (255, 255, 255, 255),
            font=ImageFont.truetype(FontPaths.ZHIZI, 35),
        )

        await self.whiledraw(self.b50player.song_data_b35, True)
        await self.whiledraw(self.b50player.song_data_b15, False)

        self._im = add_rounded_corners_to_image(self._im, 35)
        return self._im


def get_char_width(codepoint: int) -> int:
    widths = [
        (126, 1),
        (159, 0),
        (687, 1),
        (710, 0),
        (711, 1),
        (727, 0),
        (733, 1),
        (879, 0),
        (1154, 1),
        (1161, 0),
        (4347, 1),
        (4447, 2),
        (7467, 1),
        (7521, 0),
        (8369, 1),
        (8426, 0),
        (9000, 1),
        (9002, 2),
        (11021, 1),
        (12350, 2),
        (12351, 1),
        (12438, 2),
        (12442, 0),
        (19893, 2),
        (19967, 1),
        (55203, 2),
        (63743, 1),
        (64106, 2),
        (65039, 1),
        (65059, 0),
        (65131, 2),
        (65279, 1),
        (65376, 2),
        (65500, 1),
        (65510, 2),
        (120831, 1),
        (262141, 2),
        (1114109, 1),
    ]
    if codepoint in {0xE, 0xF}:
        return 0
    for num, wid in widths:
        if codepoint <= num:
            return wid
    return 1


def column_width(text: str) -> int:
    res = 0
    for ch in text:
        res += get_char_width(ord(ch))
    return res


def change_column_width(text: str, max_len: int) -> str:
    res = 0
    chars: list[str] = []
    for ch in text:
        res += get_char_width(ord(ch))
        if res <= max_len:
            chars.append(ch)
    return "".join(chars)


# Backward-compatible aliases for legacy callers.
getCharWidth = get_char_width
coloumWidth = column_width
changeColumnWidth = change_column_width
