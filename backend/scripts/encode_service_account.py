"""Encodes a Firebase service-account JSON file into the base64 value that
`backend/.env`'s FIREBASE_SERVICE_ACCOUNT_B64 expects.

Run locally so the private key never travels anywhere:

    python scripts/encode_service_account.py ~/Downloads/vehicle-rent-001-firebase-adminsdk-xxxxx.json

Then paste the printed line into backend/.env and delete the JSON file.

With --write it edits backend/.env in place, so the key is never echoed to your
terminal (and therefore never lands in shell history or a scrollback buffer):

    python scripts/encode_service_account.py <file.json> --write
"""

from __future__ import annotations

import argparse
import base64
import json
import pathlib
import re
import sys

REQUIRED_FIELDS = ("type", "project_id", "private_key", "client_email")
ENV_PATH = pathlib.Path(__file__).resolve().parents[1] / ".env"
ENV_KEY = "FIREBASE_SERVICE_ACCOUNT_B64"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("json_path", help="Path to the downloaded service-account JSON")
    parser.add_argument(
        "--write",
        action="store_true",
        help=f"Write straight into backend/.env instead of printing (keeps the key out of your terminal)",
    )
    args = parser.parse_args()

    path = pathlib.Path(args.json_path).expanduser()
    if not path.is_file():
        print(f"error: no such file: {path}", file=sys.stderr)
        return 1

    try:
        info = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"error: not valid JSON ({exc})", file=sys.stderr)
        return 1

    # Fail loudly on the wrong file — the web config and the service account are
    # easy to mix up, and the resulting runtime error is opaque.
    missing = [f for f in REQUIRED_FIELDS if f not in info]
    if missing:
        print(
            f"error: {path.name} is missing {', '.join(missing)}.\n"
            "This looks like the Firebase *web app* config, not a service account.\n"
            "Download the right one from: Project Settings -> Service accounts -> Generate new private key",
            file=sys.stderr,
        )
        return 1

    if info.get("type") != "service_account":
        print(f"error: expected type 'service_account', got {info.get('type')!r}", file=sys.stderr)
        return 1

    encoded = base64.b64encode(json.dumps(info).encode("utf-8")).decode("ascii")

    print(f"project_id:   {info['project_id']}", file=sys.stderr)
    print(f"client_email: {info['client_email']}", file=sys.stderr)

    if not args.write:
        print(f"\n{ENV_KEY}={encoded}")
        print("\nPaste the line above into backend/.env, then delete the JSON file.", file=sys.stderr)
        return 0

    if not ENV_PATH.is_file():
        print(f"error: {ENV_PATH} not found — copy backend/.env.example to backend/.env first", file=sys.stderr)
        return 1

    env = ENV_PATH.read_text(encoding="utf-8")
    line = f"{ENV_KEY}={encoded}"
    if re.search(rf"^{ENV_KEY}=.*$", env, flags=re.MULTILINE):
        env = re.sub(rf"^{ENV_KEY}=.*$", line, env, count=1, flags=re.MULTILINE)
    else:
        env = env.rstrip("\n") + f"\n{line}\n"
    ENV_PATH.write_text(env, encoding="utf-8")

    print(f"\nwrote {ENV_KEY} into {ENV_PATH} ({len(encoded)} chars)", file=sys.stderr)
    print("Now delete the downloaded JSON file.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
