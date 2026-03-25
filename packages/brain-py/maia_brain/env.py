"""Auto-load .env files and resolve environment variables.

The SDK automatically loads .env from the current directory and parents.
API keys can be set as:
  - Direct value: api_key="sk-..."
  - Env reference: api_key="env:OPENAI_API_KEY"
  - Empty string: auto-detects from OPENAI_API_KEY or ANTHROPIC_API_KEY env vars
"""

from __future__ import annotations

import os
from pathlib import Path

_loaded = False


def load_env() -> None:
    """Load .env file from current directory or parents. Called once automatically."""
    global _loaded
    if _loaded:
        return
    _loaded = True

    # Try python-dotenv if available
    try:
        from dotenv import load_dotenv
        load_dotenv()
        return
    except ImportError:
        pass

    # Fallback: manual .env parsing
    env_path = _find_env_file()
    if env_path:
        _parse_env_file(env_path)


def _find_env_file() -> Path | None:
    """Walk up from cwd to find .env file."""
    current = Path.cwd()
    for _ in range(10):  # max 10 levels up
        env_file = current / ".env"
        if env_file.is_file():
            return env_file
        parent = current.parent
        if parent == current:
            break
        current = parent
    return None


def _parse_env_file(path: Path) -> None:
    """Simple .env parser — handles KEY=VALUE, quotes, comments."""
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip()
        # Remove quotes
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
            value = value[1:-1]
        # Don't overwrite existing env vars
        if key not in os.environ:
            os.environ[key] = value


def resolve_api_key(api_key: str) -> str:
    """Resolve an API key value.

    - "sk-..." → returned as-is
    - "env:OPENAI_API_KEY" → reads from env var
    - "" → auto-detects from OPENAI_API_KEY or ANTHROPIC_API_KEY
    """
    load_env()

    if api_key and not api_key.startswith("env:"):
        return api_key

    if api_key.startswith("env:"):
        var_name = api_key[4:]
        value = os.environ.get(var_name, "")
        if not value:
            raise ValueError(f"Environment variable {var_name} not set. Check your .env file.")
        return value

    # Auto-detect
    for var in ("OPENAI_API_KEY", "ANTHROPIC_API_KEY", "MAIA_API_KEY"):
        value = os.environ.get(var, "")
        if value:
            return value

    raise ValueError(
        "No API key found. Set it in one of these ways:\n"
        "  1. LLMConfig(api_key='sk-...')\n"
        "  2. LLMConfig(api_key='env:OPENAI_API_KEY')\n"
        "  3. Set OPENAI_API_KEY in .env file or environment\n"
        "  4. Set ANTHROPIC_API_KEY in .env file or environment"
    )