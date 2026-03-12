from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, SmallInteger, String, create_engine
from sqlalchemy.orm import declarative_base

from src.core.settings import DATABASE_PATH

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(36), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    data = Column(String(255), nullable=True)
    platform_id = Column(SmallInteger, default=0)
    score = Column(Integer, default=0)
    score_update_count = Column(Integer, default=0)
    favorite_id = Column(SmallInteger, default=0)
    modified_at = Column(
        DateTime,
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now(),
    )


engine = create_engine(f"sqlite:///{DATABASE_PATH}")
Base.metadata.create_all(engine)
