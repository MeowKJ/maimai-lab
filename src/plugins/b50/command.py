import random
import time

import maimai_py.exceptions
from botpy import logger
from botpy.message import Message, GroupMessage
from maimai_py import MaimaiScores, PlayerIdentifier

from src.libraries.assets import assets, AssetType
from src.libraries.common.file import TempFileManager
from src.libraries.common.maimai import maimai, fish_provider, lxns_provider
from src.libraries.common.message.message import MixMessage
from src.libraries.database import (
    add_or_update_user,
    get_user_by_id,
    update_user_score,
    update_user_favorite,
)
from src.libraries.database.exceptions import DatabaseOperationError
from .draw import DrawBest
from .tools import is_fish_else_lxns

# 定义查分平台的常量
FISH = 0
LXNS = 1
NONE = -1
PLATFORM_STR = ["水鱼查分器", "落雪咖啡屋"]


# 处理 /bind 指令的异步函数
async def handle_bind(message: Message | GroupMessage):
    mix_message = MixMessage(message)

    user_id = mix_message.user_id
    content = mix_message.get_args("/bind")

    # 如果用户没有提供绑定信息，返回绑定说明
    if not content:
        content = (
            "📖 绑定指令使用说明:\n\n"
            "使用 `/bind` 指令可以绑定水鱼查分器的用户名或落雪咖啡屋绑定的 QQ 号。\n\n"
            "👤 基本用法:\n"
            "- `/bind 你的用户名` - 绑定你的用户名（水鱼）或 QQ 号（落雪）。\n"
            "  例如：`/bind xxx`\n\n"
            "⚙️ 自动判断:\n"
            "默认情况下，系统会自动判断平台。\n\n"
            "🌐 指定平台（仅在自动识别错误的情况下）:\n"
            "- 在用户名后加一个空格并添加平台标识：\n"
            "  - `f` 表示水鱼查分器\n"
            "  - `l` 表示落雪咖啡屋\n"
            "  例如：`/bind xxx f` 将用户名 xxx 强制指定到水鱼查分器。\n\n"
            "💡 小提示:\n"
            "输入 `/` 可以快速唤起我。如果遇到问题，请联系频道主。"
        )
        await mix_message.reply(content=content, use_reference=True)
        return

    # 获取用户名和平台信息
    content_list_raw = content.split(" ")

    platform_id = NONE

    content_list = [item for item in content_list_raw if item != ""]
    if content_list[-1] == "f":
        platform_id = FISH
        content_list.pop()
    elif content_list[-1] == "l":
        platform_id = LXNS
        content_list.pop()

    if len(content_list) > 1:
        has_space = True
    else:
        has_space = False

    user_name = " ".join(content_list)

    if platform_id == NONE:
        # 根据用户名自动判断平台
        if is_fish_else_lxns(user_name):
            platform_id = FISH
        else:
            platform_id = LXNS

    logger.info(
        f"[BIND]用户 {user_id} 尝试绑定: {user_name} 平台: {PLATFORM_STR[platform_id]}"
    )
    # 如果是绑定音击小女孩
    if user_name.startswith("@OngekiGirls"):
        content_list = user_name.split(" ")
        args = content_list[1]
        logger.info(f"[BIND]用户 {user_id} 尝试绑定音击小女孩: {args}")

        if args == "show":
            await mix_message.reply(
                file_image=await assets.get_async(AssetType.ONGEKI, "OngekiGirls.png")
            )
            return

        try:
            girl_number = float(args)

            # 检查是否为整数且在 0 到 17 之间
            if girl_number.is_integer() and 0 <= int(girl_number) <= 17:
                girl_number = int(girl_number)
                try:
                    update_user_favorite(user_id, girl_number)
                    await mix_message.reply(
                        content=f"🎉 已成功绑定音击小女孩 {girl_number}!",
                        use_reference=True,
                    )

                except Exception as e:
                    logger.error(f"绑定音击小女孩时出错: {e}")
                    await mix_message.reply(
                        content="❌ 绑定失败, 首先需要绑定查分器。",
                        use_reference=True,
                    )

            else:
                await mix_message.reply(
                    content=f"❌ 输入的数字无效，请输入 1 到 17 之间的整数。",
                    use_reference=True,
                )

        except ValueError:
            await mix_message.reply(
                content=f"❌ 输入的数字无效，请输入 1 到 17 之间的整数。",
                use_reference=True,
            )
        return

    # 绑定音击小女孩结束

    # 尝试绑定用户到数据库
    try:
        add_or_update_user(user_id, user_name, platform_id)
    except DatabaseOperationError as e:
        logger.error(f"绑定用户时出错: {e}")
        await mix_message.reply(
            content=f"❌ 绑定失败，由于数据库操作出错，请稍后再试。",
            use_reference=True,
        )

        return

    if platform_id == LXNS:
        # 隐藏 QQ 号中间部分，仅显示前两位和最后两位
        user_name = f"{user_name[:2]}****{user_name[-2:]}"

    content = (
        f"🎉 [{user_name}] 已成功绑定到你的频道号！\n"
        f"✅ 查分平台: [{PLATFORM_STR[platform_id]}]\n"
        "📊 你可以使用 /b50 指令来查分。\n"
        "⏳ 提示: 初次查分时, 可能需要稍作等待, 因为bot需要下载缺失的资源。"
    )
    if has_space:
        content += (
            "\n💡 注意: 你的用户名中存在空格, 为了兼容性, bot保留了一个这个空格。"
        )

    # 8 分之一的概率显示隐藏内容
    if random.randint(1, 8) == 1:
        content += (
            "\n\n🎀 绑定喜欢的音击小女孩!（隐藏功能）:\n"
            "- 输入 `/bind @OngekiGirls show` 可以查看音击小女孩列表。\n"
            "- 输入 `/bind @OngekiGirls 序号` 可以绑定你喜欢的音击小女孩。\n"
            "  例如：`/bind @OngekiGirls 1`\n"
            "序号0为不绑定, 序号1-17为对应的音击小女孩。\n"
            "绑定的小女孩将会在你的 B50 中出现哦~"
        )

    # 成功绑定后回复用户
    await mix_message.reply(content=content, use_reference=True)


# 处理 /b50 指令的异步函数
async def handle_b50(message: Message):
    mix_message = MixMessage(message)
    user_id = mix_message.user_id

    start_time = time.time()

    # 尝试从数据库获取用户信息
    try:
        username, platform_id, score, favorite_id = get_user_by_id(user_id)
    except Exception:
        await mix_message.reply(
            content=(
                "⚠️ 查分失败：你尚未绑定查分器账号。\n"
                "请使用 /bind 指令绑定你的查分器账号，然后再尝试查分。\n"
                "由于QQ官方限制, 频道中和Q群中的数据是独立的, 需要分别绑定。"
            ),
            use_reference=True,
        )
        return

    # 获取查分器数据
    try:
        # 初始化玩家对象
        # maimai_player = MaimaiUser(id=username, user_platform=platform_id)
        # 使用maimai.py 重构项目
        if platform_id == FISH:
            scores: MaimaiScores = await maimai.bests(PlayerIdentifier(username=username), provider=fish_provider)
            player = await maimai.players(PlayerIdentifier(username=username), provider=fish_provider)
        elif platform_id == LXNS:
            qq = int(username)
            scores: MaimaiScores = await maimai.bests(PlayerIdentifier(qq=qq), provider=lxns_provider)
            player = await maimai.players(PlayerIdentifier(qq=qq), provider=lxns_provider)
        else:
            # 抛出异常
            raise ValueError("无效的平台ID")
    except maimai_py.exceptions.InvalidPlayerIdentifierError:
        await mix_message.reply(
            content=(
                "⚠️ 查分失败：你提供的用户名或QQ号无效。\n"
                "请检查你绑定的查分器账号是否正确，然后再尝试查分。\n"
                "如果问题仍然存在，请联系频道主寻求帮助。\n\n"
                f"当前查分器平台: {PLATFORM_STR[platform_id]}\n"
                f"用户名: {username}"
            ),
            use_reference=True,
        )

    except Exception as e:
        logger.error(f"获取查分器数据时出错: {e}")
        await mix_message.reply(
            content=(
                "⚠️ 获取数据时出错，请检查以下事项：\n"
                "1.确认用户名或QQ号是否正确输入。\n"
                "2.检查查分网站隐私设置，确保查分器有权限访问你的数据。\n"
                "3.尝试重新操作几次。\n"
                "如果问题仍然存在，请联系频道主寻求帮助。\n\n"
                f"当前查分器平台: {PLATFORM_STR[platform_id]}\n"
                f"用户名: {username}"
                f"\n错误信息: {e}"
            ),
            use_reference=True,
        )
        return
        # 绘制和压缩图片
        # 绘制图片
    draw_best = DrawBest(scores, player, platform_id, favorite_id, mix_message.avatar_url)
    draw = await draw_best.draw()

    temp_manager = TempFileManager()
    if mix_message.message_type == "group":
        temp_file, _ = temp_manager.create_temp_image_file(draw, ".jpg", quality=70)
    else:
        temp_file, _ = temp_manager.create_temp_image_file(draw, ".jpg", quality=70)

    # 更新用户分数到数据库
    try:
        update_user_score(user_id, player.rating)
    except DatabaseOperationError as e:
        logger.error(f"更新用户时出错: {e}")
        return

    # 计算生成时间
    generation_time = time.time() - start_time

    # 回复压缩后的图片
    await mix_message.reply(
        file_image=temp_file
    )

    # 回复生成成功信息
    if generation_time <= 20:
        time_message = ""
    elif generation_time <= 45:
        time_message = "你的 B50 中有些冷门歌曲了, 所以 bot 下载了一些资源~\n"
    elif generation_time <= 75:
        time_message = (
            "你的 B50 中有比较多的冷门歌曲, bot 下载了一些资源以确保完整性~\n"
        )
    else:
        time_message = (
            "你的 B50 中包含了很多冷门歌曲, bot 需要花费较长时间下载资源~\n"
        )

    await mix_message.reply(
        content=(
            f"🎉 B50[{PLATFORM_STR[platform_id]}] 生成成功啦，耗时 {generation_time:.2f} 喵！\n"
            f"{time_message}"
            "更多有趣的统计信息可以去 Maimai 的网页查分器查看-参见频道帖子中的相关教程\n"
            "如果有任何问题或建议，请联系频道主。"
        ),
        use_reference=True,
    )


# 空操作函数，用于处理无效指令
async def do_nothing(message: Message):
    pass


async def bind_qrcode(message: Message):
    mix_message = MixMessage(message)
    user_id = mix_message.user_id

    # 尝试从数据库获取用户信息
    try:
        username, platform_id, score, favorite_id = get_user_by_id(user_id)
    except Exception:
        await mix_message.reply(
            content=(
                "⚠️ 你尚未绑定查分器账号。\n"
                "请使用 /bind 指令绑定你的查分器账号，然后再尝试查分。\n"
                "由于QQ官方限制, 频道中和Q群中的数据是独立的, 需要分别绑定。"
            ),
            use_reference=True,
        )
        return

    if platform_id == LXNS:
        await mix_message.reply(
            content="❌ 落雪咖啡屋用户无法使用此功能。",
            use_reference=True,
        )
        return

    qr_code_file = await maimai.get_qrcode(PlayerIdentifier(username=username), provider=fish_provider)

    if qr_code_file is None:
        await mix_message.reply(
            content="❌ 获取二维码失败，请稍后再试。",
            use_reference=True,
        )
        return

    await mix_message.reply(
        content="📱 这是你的水鱼查分器二维码，请保存好它！\n"
                "如果你更换了手机或浏览器，可以通过扫描此二维码重新登录。\n"
                "注意：二维码有时间限制，请尽快使用。",
        file_image=qr_code_file,
        use_reference=True,
    )


# 定义支持的指令及其处理函数（指令名应为小写）
COMMANDS = {
    "bind": handle_bind,
    "b50": handle_b50,
    "bindo": do_nothing,
    "b50o": do_nothing,
}

# 默认大写的插件名
COMMAND_NAME = "B50"
# 指令范围
COMMAND_SCOPE = "both"
