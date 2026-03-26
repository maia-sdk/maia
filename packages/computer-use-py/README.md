# maia-computer-use

> Maia computer runtime client for Python.

## Install

```bash
pip install maia-computer-use
```

## Usage

```python
from maia_computer_use import create_computer_use_client

client = create_computer_use_client()
session = client.start_session({"url": "https://example.com"})
print(session.session_id)
```

## What it includes

- session start/get/list/cancel
- navigate session
- active model and policy lookup
- SLO summary lookup
- stream session events over SSE
