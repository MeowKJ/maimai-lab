class UserNotFoundError(Exception):
    """用户不存在时抛出。"""


class DatabaseOperationError(Exception):
    """数据库操作失败时抛出。"""
