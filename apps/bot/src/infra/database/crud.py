from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass
from typing import Iterator

from botpy import logger
from sqlalchemy.orm import Session, scoped_session, sessionmaker

from .exceptions import DatabaseOperationError, UserNotFoundError
from .models import User, engine
SessionLocal = scoped_session(
    sessionmaker(autocommit=False, autoflush=False, bind=engine)
)


@dataclass(frozen=True)
class UserBinding:
    name: str
    platform_id: int
    score: int
    favorite_id: int


@contextmanager
def session_scope() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


class UserRepository:
    def add_or_update_user(self, user_id: str, name: str, platform_id: int) -> None:
        try:
            with session_scope() as session:
                user = session.query(User).filter(User.user_id == user_id).first()
                if user:
                    user.name = name
                    user.platform_id = platform_id
                else:
                    session.add(User(user_id=user_id, name=name, platform_id=platform_id))
        except Exception as exc:
            logger.error(
                f"[Database] Error adding or updating user with ID {user_id}: {exc}"
            )
            raise DatabaseOperationError(
                f"Error adding or updating user with ID {user_id}: {exc}"
            ) from exc

    def get_user_by_id(self, user_id: str) -> UserBinding:
        try:
            with session_scope() as session:
                user = session.query(User).filter(User.user_id == user_id).first()
                if not user:
                    raise UserNotFoundError(f"User with ID {user_id} not found.")
                return UserBinding(
                    name=user.name,
                    platform_id=user.platform_id,
                    score=user.score,
                    favorite_id=user.favorite_id,
                )
        except UserNotFoundError:
            logger.warning(f"[Database] User with ID {user_id} not found.")
            raise
        except Exception as exc:
            logger.error(f"[Database] Error retrieving user with ID {user_id}: {exc}")
            raise DatabaseOperationError(
                f"Error retrieving user with ID {user_id}: {exc}"
            ) from exc

    def update_user_score(self, user_id: str, new_score: int) -> None:
        try:
            with session_scope() as session:
                user = session.query(User).filter(User.user_id == user_id).first()
                if not user:
                    raise UserNotFoundError(f"User with ID {user_id} not found.")
                user.score = new_score
                user.score_update_count += 1
        except UserNotFoundError:
            logger.warning(f"[Database] User with ID {user_id} not found.")
            raise
        except Exception as exc:
            logger.error(f"[Database] Error updating score for user with ID {user_id}: {exc}")
            raise DatabaseOperationError(
                f"Error updating score for user with ID {user_id}: {exc}"
            ) from exc


user_repository = UserRepository()


def add_or_update_user(user_id: str, name: str, platform_id: int) -> None:
    user_repository.add_or_update_user(user_id=user_id, name=name, platform_id=platform_id)


def get_user_by_id(user_id: str) -> tuple[str, int, int, int]:
    binding = user_repository.get_user_by_id(user_id)
    return binding.name, binding.platform_id, binding.score, binding.favorite_id


def update_user_score(user_id: str, new_score: int) -> None:
    user_repository.update_user_score(user_id=user_id, new_score=new_score)
