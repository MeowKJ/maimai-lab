from src.domain.maimai.enums import MaimaiUserPlatform
from src.features.b50.service import B50Service


def test_parse_bind_content_auto_detect_lxns() -> None:
    user_name, platform_id, has_space = B50Service.parse_bind_content("12345678")
    assert user_name == "12345678"
    assert platform_id == MaimaiUserPlatform.LXNS.value
    assert has_space is False


def test_parse_bind_content_platform_suffix() -> None:
    user_name, platform_id, has_space = B50Service.parse_bind_content("komo f")
    assert user_name == "komo"
    assert platform_id == MaimaiUserPlatform.DIVING_FISH.value
    assert has_space is False


def test_parse_bind_content_with_space_name() -> None:
    user_name, platform_id, has_space = B50Service.parse_bind_content("k o m o l")
    assert user_name == "k o m o"
    assert platform_id == MaimaiUserPlatform.LXNS.value
    assert has_space is True
