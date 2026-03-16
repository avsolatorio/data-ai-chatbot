#!/usr/bin/env python3
"""
Run Alembic migrations on a new or existing database.
Provide variables via environment or command-line arguments.

Usage:
  # Via environment variables
  POSTGRES_HOST=localhost POSTGRES_PORT=5432 POSTGRES_ALEMBIC_USER=adminuser \\
    POSTGRES_ALEMBIC_PASSWORD=adminpassword POSTGRES_DB=chatbot_db \\
    python scripts/run_migrations.py

  # Via arguments (overrides env)
  python scripts/run_migrations.py --host localhost --port 5432 --db chatbot_db \\
    --alembic-user adminuser --alembic-password adminpassword

  # Mix: env for most, args for overrides
  POSTGRES_ALEMBIC_USER=adminuser POSTGRES_ALEMBIC_PASSWORD=secret \\
    python scripts/run_migrations.py --host prod-db.example.com
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

# Defaults (match .env.example)
DEFAULTS = {
    "POSTGRES_HOST": "localhost",
    "POSTGRES_PORT": "5432",
    "POSTGRES_USER": "user",
    "POSTGRES_PASSWORD": "password",  # pragma: allowlist secret
    "POSTGRES_DB": "chatbot_db",
    "POSTGRES_ALEMBIC_USER": "adminuser",
    "POSTGRES_ALEMBIC_PASSWORD": "adminpassword",  # pragma: allowlist secret
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run Alembic migrations using the provided database credentials. "
        "Variables can be set via environment or via options below."
    )
    parser.add_argument(
        "--host",
        default=os.environ.get("POSTGRES_HOST", DEFAULTS["POSTGRES_HOST"]),
        help="PostgreSQL host (default: localhost)",
    )
    parser.add_argument(
        "--port",
        default=os.environ.get("POSTGRES_PORT", DEFAULTS["POSTGRES_PORT"]),
        help="PostgreSQL port (default: 5432)",
    )
    parser.add_argument(
        "--db",
        default=os.environ.get("POSTGRES_DB", DEFAULTS["POSTGRES_DB"]),
        help="Database name (default: chatbot_db)",
    )
    parser.add_argument(
        "--user",
        default=os.environ.get("POSTGRES_USER", DEFAULTS["POSTGRES_USER"]),
        help="App user (for POSTGRES_USER; optional)",
    )
    parser.add_argument(
        "--password",
        default=os.environ.get("POSTGRES_PASSWORD", DEFAULTS["POSTGRES_PASSWORD"]),
        help="App user password (optional)",
    )
    parser.add_argument(
        "--alembic-user",
        default=os.environ.get("POSTGRES_ALEMBIC_USER", DEFAULTS["POSTGRES_ALEMBIC_USER"]),
        help="Alembic/migration user (default: adminuser)",
    )
    parser.add_argument(
        "--alembic-password",
        default=os.environ.get("POSTGRES_ALEMBIC_PASSWORD", DEFAULTS["POSTGRES_ALEMBIC_PASSWORD"]),
        help="Alembic user password (default: adminpassword)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    env = os.environ.copy()
    env["POSTGRES_HOST"] = args.host
    env["POSTGRES_PORT"] = args.port
    env["POSTGRES_USER"] = args.user
    env["POSTGRES_PASSWORD"] = args.password
    env["POSTGRES_DB"] = args.db
    env["POSTGRES_ALEMBIC_USER"] = args.alembic_user
    env["POSTGRES_ALEMBIC_PASSWORD"] = args.alembic_password

    script_dir = Path(__file__).resolve().parent
    backend_dir = script_dir.parent.parent

    print(
        f"Running migrations against {args.host}:{args.port}/{args.db} (user: {args.alembic_user})"
    )

    result = subprocess.run(
        ["uv", "run", "alembic", "upgrade", "head"],
        cwd=backend_dir,
        env=env,
    )

    if result.returncode == 0:
        print("Migrations complete.")
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
