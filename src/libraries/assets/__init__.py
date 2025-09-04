import os.path

from config import ASSETS_URL
from .get import Assets, AssetType, JSONType

# 获取 Assets 类的单例实例
assets = Assets(base_url=ASSETS_URL, assets_folder=os.path.join(os.getcwd(), "static"), proxy="http://127.0.0.1:7897")
