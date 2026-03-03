from src.domain.maimai.maimai import MaimaiHelper
from src.domain.maimai.enums import MaimaiUserPlatform


def test_guess_user_platform_lxns_for_qq_account() -> None:
    assert MaimaiHelper.guess_user_platform("123456789") == MaimaiUserPlatform.LXNS.value


def test_guess_user_platform_diving_fish_for_username() -> None:
    assert (
        MaimaiHelper.guess_user_platform("komooooo")
        == MaimaiUserPlatform.DIVING_FISH.value
    )
