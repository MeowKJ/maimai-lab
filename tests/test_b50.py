import sys

import pytest

print(sys.path)

# test module
from src.plugins.b50.command import *


@pytest.mark.asyncio
async def test_create_song_info_image_show():
    username = ("1379724301")
    platform_id = 1
    user_id = 1

    if platform_id == FISH:
        scores: MaimaiScores = await maimai.bests(PlayerIdentifier(username=username), provider=fish_provider)
        player = await maimai.players(PlayerIdentifier(username=username), provider=fish_provider)
    else:
        qq = int(username)
        scores: MaimaiScores = await maimai.bests(PlayerIdentifier(qq=qq), provider=lxns_provider)
        player = await maimai.players(PlayerIdentifier(qq=qq), provider=lxns_provider)

    assert scores is not None
    assert player is not None

    db = DrawBest(scores, player, platform_id, 1, avatar_url="https://q1.qlogo.cn/g?b=qq&nk=1379724301&s=640")
    draw = await db.draw()
    draw.show()
    assert True
