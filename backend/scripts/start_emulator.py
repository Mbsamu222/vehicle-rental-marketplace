"""Starts the Firebase Auth emulator using the settings in backend/.env.

The Firebase CLI cannot read `.env` — it only takes a `firebase.json`. Rather
than committing a second config file that can drift out of sync with `.env`,
this reads the port and project id from `.env`, writes a throwaway config, and
hands it to the CLI with `--config`.

That keeps `.env` the single source of truth: change
FIREBASE_AUTH_EMULATOR_HOST there and the emulator follows.

    cd backend && python scripts/start_emulator.py
"""

from __future__ import annotations

import json
import pathlib
import shutil
import subprocess
import sys

BACKEND = pathlib.Path(__file__).resolve().parents[1]
ENV_PATH = BACKEND / ".env"
# Gitignored; regenerated on every run so it can never drift from .env.
GENERATED_CONFIG = BACKEND / ".firebase-emulator.json"


def read_env() -> dict[str, str]:
    if not ENV_PATH.is_file():
        sys.exit(f"error: {ENV_PATH} not found — copy .env.example to .env first")

    values: dict[str, str] = {}
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def main() -> int:
    # On Windows the CLI is a .cmd shim, so subprocess must be given the
    # resolved path — a bare "firebase" raises FileNotFoundError.
    firebase_bin = shutil.which("firebase")
    if firebase_bin is None:
        sys.exit("error: firebase CLI not found. Install with: npm i -g firebase-tools")

    env = read_env()

    host_port = env.get("FIREBASE_AUTH_EMULATOR_HOST", "")
    if not host_port:
        sys.exit(
            "error: FIREBASE_AUTH_EMULATOR_HOST is not set in backend/.env.\n"
            "Add:  FIREBASE_AUTH_EMULATOR_HOST=localhost:9099"
        )

    host, _, port = host_port.partition(":")
    if not port.isdigit():
        sys.exit(f"error: FIREBASE_AUTH_EMULATOR_HOST must be host:port, got {host_port!r}")

    # The Admin SDK connects to whatever host string .env specifies, but the
    # emulator itself must bind an address. "localhost" resolves to ::1 on some
    # Windows setups while the SDK dials 127.0.0.1, so bind explicitly.
    bind = "127.0.0.1" if host in ("localhost", "") else host

    project = env.get("FIREBASE_PROJECT_ID") or "demo-project"

    GENERATED_CONFIG.write_text(
        json.dumps(
            {
                "emulators": {
                    "auth": {"host": bind, "port": int(port)},
                    # The emulator UI is a separate download and is not needed
                    # for token issuance.
                    "ui": {"enabled": False},
                    "singleProjectMode": True,
                }
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    print(f"Auth emulator -> {bind}:{port}   project: {project}   (from backend/.env)")

    return subprocess.call(
        [
            firebase_bin,
            "emulators:start",
            "--only",
            "auth",
            "--project",
            project,
            "--config",
            str(GENERATED_CONFIG),
        ],
        cwd=BACKEND,
    )


if __name__ == "__main__":
    raise SystemExit(main())
