from maimai_py import MaimaiClient, DivingFishProvider, LXNSProvider

from config import DIVINGFISH_API_TOKEN, LXNS_API_SECRET

maimai = MaimaiClient()  # 全局创建 MaimaiClient 实例
fish_provider = DivingFishProvider(developer_token=DIVINGFISH_API_TOKEN)
lxns_provider = LXNSProvider(developer_token=LXNS_API_SECRET)
