import pytest
from maimai_py import (
    PlayerIdentifier,
)

from src.libraries.common.maimai import maimai, fish_provider, lxns_provider


# 全局初始化 MaimaiClient 和提供者


@pytest.mark.asyncio
async def test_fetch_turou_scores():
    """测试获取水鱼查分器用户 turou 的成绩"""
    player_identifier = PlayerIdentifier(qq=1379724301)
    player_identifier_fish = PlayerIdentifier(username="turou")
    # 获取玩家信息
    player = await maimai.players(player_identifier, provider=lxns_provider)
    player2 = await maimai.players(player_identifier_fish, provider=fish_provider)
    print(player2.rating)
    # 获取玩家成绩
    scores = await maimai.scores(player_identifier, provider=lxns_provider)

    # 获取玩家最佳成绩
    bests = await maimai.bests(player_identifier, provider=lxns_provider)

    # 打印 B15 评分作为调试信息（pytest 会显示 print 输出）
    print(bests.scores_b15)
    print(bests.scores_b35)
    # 打印best.get_mapping()作为调试信息
    # async def get_mapping(self) -> Coroutine[Any, Any, list[tuple[Song, SongDifficulty, ScoreExtend]]]
    # mapping = await bests.get_mapping()
    # for song, difficulty, score in mapping:
    #     print(f"{song} - {difficulty} - {score}")
