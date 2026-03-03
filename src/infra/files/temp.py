from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Tuple

from PIL import Image

from src.core.settings import TEMP_FOLDER


class TempFileManager:
    def __init__(self) -> None:
        self.temp_dir = Path(TEMP_FOLDER)
        self.temp_dir.mkdir(parents=True, exist_ok=True)

    def create_temp_image_file(
        self,
        image: Image.Image,
        suffix: str = ".png",
        prefix: str = "temp_image_",
        quality: int = 80,
    ) -> Tuple[str, str]:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix,
            prefix=prefix,
            dir=str(self.temp_dir),
        ) as temp_file:
            temp_path = Path(temp_file.name)

        if suffix == ".png":
            image.save(temp_path, "PNG")
        elif suffix == ".jpg":
            if image.mode == "RGBA":
                image = image.convert("RGB")
            image.save(temp_path, "JPEG", quality=quality)
        else:
            image.save(temp_path)
        return str(temp_path), temp_path.name
