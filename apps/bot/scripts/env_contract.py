from __future__ import annotations

import re
import sys
from pathlib import Path

ENV_LINE_PATTERN = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=")

BOT_REQUIRED = {
    "MAIMAI_DEBUG",
    "MAIMAI_BOT_APPID",
    "MAIMAI_BOT_SECRET",
    "MAIMAI_BOT_VERSION",
    "MAIMAI_LXNS_API_SECRET",
    "MAIMAI_ASSETS_URL",
    "MAIMAI_IMAGE_SERVER_URL",
    "MAIMAI_DEFAULT_AVATAR_URL",
    "MAIMAI_DATABASE_PATH",
    "MAIMAI_TEMP_DIR",
}


def read_env_keys(path: Path) -> set[str]:
    if not path.exists():
        raise FileNotFoundError(f"Missing env template: {path}")

    keys: set[str] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        raw = line.strip()
        if not raw or raw.startswith("#"):
            continue
        matched = ENV_LINE_PATTERN.match(raw)
        if matched:
            keys.add(matched.group(1))
    return keys


def assert_contract(path: Path, required: set[str]) -> list[str]:
    keys = read_env_keys(path)
    missing = sorted(required - keys)
    return missing


def main() -> int:
    bot_root = Path(__file__).resolve().parents[1]
    contracts = (
        (bot_root / ".env.example", BOT_REQUIRED),
    )

    failed = False
    for env_file, required in contracts:
        missing = assert_contract(env_file, required)
        if missing:
            failed = True
            print(f"[env-contract] missing keys in {env_file}:")
            for key in missing:
                print(f"  - {key}")
        else:
            print(f"[env-contract] OK: {env_file}")

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
