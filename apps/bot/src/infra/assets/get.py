from __future__ import annotations

import asyncio
import json
import time
from enum import Enum
from pathlib import Path

import aiohttp
import requests
from botpy import logger


def common_to_lxns_songid(song_id: int) -> int:
    if 10000 <= song_id < 100000:
        return song_id % 10000
    return song_id


class AssetType(Enum):
    COVER = "/assets/cover/"
    RANK = "/assets/rank/"
    BADGE = "/assets/badge/"
    COURSE_RANK = "/assets/course_rank/"
    CLASS_RANK = "/assets/class_rank/"
    RATING = "/assets/rating/"
    PLATE = "/assets/plate/"
    IMAGES = "/assets/images/"
    AVATAR = "/assets/avatar/"
    ONGEKI = "/assets/ongeki/"
    SONGINFO = "/assets/songinfo/"
    JSON = "/assets/json/"
    PRISM = "/assets/prism/"


class JSONType(Enum):
    DIVING_FISH_SONGS_INFO = "https://www.diving-fish.com/api/maimaidxprober/music_data"
    LXNS_SONGS_INFO = "https://maimai.lxns.net/api/v0/maimai/song/list?notes=true"
    ALIAS = "https://download.fanyu.site/maimai/alias.json"


class Assets:
    _instance: "Assets | None" = None

    def __new__(cls, base_url: str | None = None, assets_folder: str | None = None, proxy: str | None = None):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, base_url: str, assets_folder: str, proxy: str | None = None) -> None:
        if self._initialized:
            return
        self.base_url = base_url.rstrip("/")
        self.assets_folder = Path(assets_folder)
        self.proxy = proxy
        self._json_cache: dict[JSONType, tuple[float, dict]] = {}
        self._inflight_downloads: dict[str, asyncio.Future[None]] = {}
        self._initialized = True

    def _normalize_key(self, asset_type: AssetType, key: str | int) -> str:
        value = str(key)
        if asset_type == AssetType.COVER:
            if value.endswith(".png"):
                value = value[:-4]
            value = str(common_to_lxns_songid(int(value)))

        if asset_type == AssetType.IMAGES and not value.lower().endswith(
            (".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp")
        ):
            value += ".png"
        return value

    def _local_path(self, asset_type: AssetType, normalized_key: str) -> Path:
        return self.assets_folder / asset_type.name.lower() / normalized_key

    def _remote_url(self, asset_type: AssetType, normalized_key: str) -> str:
        return f"{self.base_url}{asset_type.value}{normalized_key}"

    def get(self, asset_type: AssetType, param_value: str | int, get_args: str = "") -> str:
        normalized_key = self._normalize_key(asset_type, param_value)
        local_path = self._local_path(asset_type, normalized_key)
        if local_path.exists():
            return str(local_path)

        self.download_file(self._remote_url(asset_type, normalized_key), local_path, self.proxy, get_args)
        return str(local_path)

    async def get_async(
        self, asset_type: AssetType, param_value: str | int, get_args: str = ""
    ) -> str:
        normalized_key = self._normalize_key(asset_type, param_value)
        local_path = self._local_path(asset_type, normalized_key)
        if local_path.exists():
            return str(local_path)

        local_path_key = str(local_path)
        inflight = self._inflight_downloads.get(local_path_key)
        if inflight is not None:
            await inflight
            return str(local_path)

        loop = asyncio.get_running_loop()
        current_future: asyncio.Future[None] = loop.create_future()
        self._inflight_downloads[local_path_key] = current_future
        try:
            await self.download_file_async(
                self._remote_url(asset_type, normalized_key),
                local_path,
                self.proxy,
                get_args,
            )
            current_future.set_result(None)
        except Exception as exc:
            if not current_future.done():
                current_future.set_result(None)
            raise
        finally:
            self._inflight_downloads.pop(local_path_key, None)
        return str(local_path)

    async def get_json(self, json_type: JSONType) -> dict:
        cached = self._json_cache.get(json_type)
        if cached:
            cached_at, payload = cached
            if (time.time() - cached_at) < 86400:
                return payload

        local_path = self.assets_folder / "json" / f"{json_type.name.lower()}.json"
        if local_path.exists():
            elapsed = time.time() - local_path.stat().st_mtime
            if elapsed < 86400:
                payload = json.loads(local_path.read_text(encoding="utf-8"))
                self._json_cache[json_type] = (time.time(), payload)
                return payload

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(json_type.value) as response:
                    if response.status != 200:
                        logger.warning(f"[ASSETS] Failed to fetch json: {json_type.value}")
                        return {}
                    payload = await response.json()
        except aiohttp.ClientError as exc:
            logger.warning(f"[ASSETS] JSON download error: {json_type.value}, {exc}")
            return {}

        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_text(json.dumps(payload), encoding="utf-8")
        self._json_cache[json_type] = (time.time(), payload)
        return payload

    @staticmethod
    def download_file(url: str, save_path: Path, proxy: str | None = None, get_args: str = "") -> None:
        try:
            response = requests.get(
                url + get_args,
                proxies={"http": proxy, "https": proxy} if proxy else None,
                timeout=60,
            )
            response.raise_for_status()
        except requests.exceptions.RequestException as exc:
            logger.warning(f"[ASSETS] Failed to download file: {url}, {exc}")
            return

        save_path.parent.mkdir(parents=True, exist_ok=True)
        save_path.write_bytes(response.content)

    @staticmethod
    async def download_file_async(
        url: str,
        save_path: Path,
        proxy: str | None = None,
        get_args: str = "",
    ) -> None:
        try:
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30)
            ) as session:
                async with session.get(url + get_args, proxy=proxy) as response:
                    if response.status != 200:
                        logger.warning(f"[ASSETS] Failed to download file: {url}")
                        return
                    content = await response.read()
        except aiohttp.ClientError as exc:
            logger.warning(f"[ASSETS] Async download error: {url}, {exc}")
            return

        save_path.parent.mkdir(parents=True, exist_ok=True)
        save_path.write_bytes(content)
