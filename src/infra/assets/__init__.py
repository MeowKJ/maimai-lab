from .get import Assets, AssetType, JSONType

from src.core.settings import ASSETS_URL

# Global singleton used by rendering/domain services.
assets = Assets(base_url=ASSETS_URL, assets_folder="static")
