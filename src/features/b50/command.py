from __future__ import annotations

from botpy import logger
from botpy.message import GroupMessage, Message
from typing import TypeAlias

from src.features.b50.service import B50DataError, B50RenderError, B50Service, NotBoundError
from src.infra.database.exceptions import DatabaseOperationError
from src.interfaces.qq.message import MixMessage

InboundMessage: TypeAlias = Message | GroupMessage

service = B50Service()


def _bind_help_message() -> str:
    """Return `/bind` command help text."""
    return (
        "📖 绑定指令使用说明:\n\n"
        "使用 `/bind` 指令可以绑定水鱼查分器的用户名或落雪咖啡屋绑定的 QQ 号。\n\n"
        "👤 基本用法:\n"
        "- `/bind 你的用户名` - 绑定你的用户名（水鱼）或 QQ 号（落雪）。\n"
        "  例如：`/bind xxx`\n\n"
        "⚙️ 自动判断:\n"
        "默认情况下，系统会自动判断平台（QQ号默认落雪，其他默认水鱼）。\n\n"
        "🌐 指定平台（仅在自动识别错误的情况下）:\n"
        "- 在用户名后加一个空格并添加平台标识：\n"
        "  - `f` 表示水鱼查分器\n"
        "  - `l` 表示落雪咖啡屋\n"
        "  例如：`/bind xxx f` 将用户名 xxx 强制指定到水鱼查分器。"
    )


def _generation_message(elapsed_seconds: float, platform_name: str) -> str:
    """Build completion message based on B50 generation latency."""
    if elapsed_seconds <= 3:
        time_message = "哇，一下子就查完了呢！\n"
    elif elapsed_seconds <= 20:
        time_message = ""
    elif elapsed_seconds <= 45:
        time_message = "你的 B50 中有些冷门歌曲了, 所以 bot 下载了一些资源喵~\n"
    elif elapsed_seconds <= 75:
        time_message = "你的 B50 中有比较多的冷门歌曲, bot 下载了一些资源以确保完整性喵~\n"
    else:
        time_message = "你的 B50 中包含了很多冷门歌曲, bot 需要花费较长时间下载资源喵~\n"

    return (
        f"🎉 B50[{platform_name}] 生成成功啦，耗时 {elapsed_seconds:.2f} 喵！\n"
        f"{time_message}"
        "更多有趣的统计信息可以去 Maimai 的网页查分器查看-参见频道帖子中的相关教程\n"
        "如果有任何问题或建议，请联系频道主。"
    )


async def handle_bind(message: InboundMessage) -> None:
    """Handle `/bind` command."""
    mix_message = MixMessage(message)
    content = mix_message.get_args("/bind")
    if not content:
        await mix_message.reply(content=_bind_help_message(), use_reference=True)
        return

    try:
        result = service.bind_user(user_id=mix_message.user_id, content=content)
    except ValueError as exc:
        await mix_message.reply(content=f"❌ {exc}", use_reference=True)
        return
    except DatabaseOperationError as exc:
        logger.error(f"[BIND] 数据库操作失败: {exc}")
        await mix_message.reply(
            content="❌ 绑定失败，由于数据库操作出错，请稍后再试。",
            use_reference=True,
        )
        return

    response = (
        f"🎉 [{result.display_name}] 已成功绑定到你的频道号！\n"
        f"✅ 查分平台: [{result.platform_name}]\n"
        "📊 你可以使用 /b50 指令来查分。\n"
        "⏳ 提示: 初次查分时, 可能需要稍作等待, 因为bot需要下载缺失的资源。"
    )
    if result.has_space:
        response += "\n💡 注意: 你的用户名中存在空格, 为了兼容性, bot保留了一个这个空格。"
    await mix_message.reply(content=response, use_reference=True)


async def handle_b50(message: InboundMessage) -> None:
    """Handle `/b50` command."""
    mix_message = MixMessage(message)
    try:
        result = await service.render_b50(
            user_id=mix_message.user_id,
            avatar_url=mix_message.avatar_url,
            message_type=mix_message.message_type,
        )
    except NotBoundError:
        await mix_message.reply(
            content=(
                "⚠️ 查分失败：你尚未绑定查分器账号。\n"
                "请使用 /bind 指令绑定你的查分器账号，然后再尝试查分。\n"
                "由于QQ官方限制, 频道中和Q群中的数据是独立的, 需要分别绑定。"
            ),
            use_reference=True,
        )
        return
    except B50DataError as exc:
        logger.error(f"[B50] 获取查分器数据失败: {exc}")
        await mix_message.reply(
            content=(
                "⚠️ 获取数据时出错，请检查以下事项：\n"
                "1.确认用户名或QQ号是否正确输入。\n"
                "2.检查查分网站隐私设置，确保查分器有权限访问你的数据。\n"
                "3.尝试重新操作几次。\n"
                "如果问题仍然存在，请联系频道主寻求帮助。"
            ),
            use_reference=True,
        )
        return
    except B50RenderError as exc:
        logger.error(f"[B50] 绘制或压缩图片失败: {exc}")
        await mix_message.reply(
            content=(
                "⚠️ 处理图片时出错, 可能是bot被玩坏了。\n"
                "如果这个问题持续出现，请联系频道主以获得帮助。"
            ),
            use_reference=True,
        )
        return

    await mix_message.reply(file_image=result.image_path)
    await mix_message.reply(
        content=_generation_message(result.elapsed_seconds, result.platform_name),
        use_reference=True,
    )


COMMANDS = {
    "bind": handle_bind,
    "b50": handle_b50,
}
