from __future__ import annotations

from pathlib import Path

import aiohttp

from src.core.settings import IMAGES_SERVER_ADDRESS


async def upload_to_image_server(file_path: str) -> str:
    upload_url = f"{IMAGES_SERVER_ADDRESS}/upload/"
    local_path = Path(file_path)

    async with aiohttp.ClientSession() as session:
        with local_path.open("rb") as file_obj:
            form_data = aiohttp.FormData()
            form_data.add_field(
                "file",
                file_obj,
                filename=local_path.name,
                content_type="image/png",
            )
            async with session.post(upload_url, data=form_data) as response:
                if response.status != 200:
                    raise RuntimeError(f"Failed to upload file: {response.status}")
                payload = await response.json()

    file_url = payload.get("file_url")
    if not file_url:
        raise RuntimeError("Failed to upload file: missing file_url in response.")
    return file_url
