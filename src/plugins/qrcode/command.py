# plugins/test/command.py
from botpy.message import Message
from maimai_py import PlayerIdentifier, ArcadeProvider

from src.libraries.common.maimai import *
from src.libraries.common.message import MixMessage

arcade_provider = ArcadeProvider()


async def handle_qrcode(message: Message):
    mix_message = MixMessage(message)

    # 截取从"SGWCMIADxxxx"开始截取

    text = message.content.split("SGWCMAID", maxsplit=1)
    if len(text) > 1:
        message.content = "SGWCMAID" + text[1].strip()
    else:
        await mix_message.reply(
            content="请发送有效的扫码内容，格式如：SGWCMAIDXXXXXX"
        )
        return
    # try:
    player_id = await maimai.qrcode(qrcode=message.content)
    if player_id is None:
        await mix_message.reply(content="请确认扫码内容正确")
        return
    player = await maimai.players(PlayerIdentifier(credentials=player_id), provider=arcade_provider)

    await mix_message.reply(content="成功获取二维码信息"
                                    f"\n玩家ID: {player.name}"
                                    f"\nRating: {player.rating}"
                                    f"\n 二维码只需绑定一次，没有必要原因请不要重复绑定")
    # except maimai_py.exceptions.AimeServerError as e:
    #     await mix_message.reply(content=f"无效的二维码: {e}.")
    #     return
    #
    # except maimai_py.exceptions.TitleServerBlockedError as e:
    #     await mix_message.reply(content=f"maimai的机器人坏了! {e}")
    #     return
    # except maimai_py.exceptions.TitleServerNetworkError as e:
    #     await mix_message.reply(content=f"无法连接到服务器! {e}")
    #     return
    # except Exception as e:
    #     await mix_message.reply(content=f"解析二维码失败: {e}")
    #     return


# 定义支持的指令及其处理函数（指令名应为小写）
COMMANDS = {
    "qrcode": handle_qrcode,
}

# 默认大写的插件名
COMMAND_NAME = "QRCODE"

# 指令范围
COMMAND_SCOPE = "direct"

DEFAULT_HANDLER = handle_qrcode
