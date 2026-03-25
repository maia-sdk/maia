# Contributing to Maia

Thanks for your interest in contributing! Here's how to get started.

## Setup

```bash
git clone https://github.com/maia-sdk/maia.git && cd maia

# JavaScript/TypeScript
pnpm install        # or: npm install
pnpm -r build       # build all packages
pnpm -r test        # run all tests

# Python
pip install -e packages/acp-py
pip install -e packages/connector-adapters
pip install -e packages/sdk-py
pip install -e packages/cli-py
python test_sdk.py

# Or both at once
make install && make test
```

## Making Changes

1. Create a branch: `git checkout -b feature/my-change`
2. Make your changes
3. Run tests: `make test`
4. Commit with a clear message: `git commit -m "feat: add X to Y"`
5. Push and open a PR

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `test:` — adding or fixing tests
- `chore:` — build, CI, tooling

## Code Style

- TypeScript: strict mode, no `any` unless unavoidable
- Python: type hints, Python 3.10+
- Keep files under 200 LOC where possible
- Tests go next to source: `foo.ts` → `foo.test.ts`

## Package Structure

Each package lives in `packages/` with:
- `src/` — source code
- `package.json` or `pyproject.toml` — manifest
- `README.md` — package docs
- `tsconfig.json` — TypeScript config (JS packages)

## Adding a Connector

1. Add the catalog entry in `packages/connectors/src/catalog.ts`
2. Add the implementation in `packages/connectors/src/implementations.ts`
3. Add the skin palette in `packages/theatre-react/src/skins/palettes.ts`
4. Add a test in `packages/connectors/src/catalog.test.ts`

## Adding an Agent Role

1. Create `packages/brain-runtime/src/roles/my_role.ts`
2. Register it in `packages/brain-runtime/src/roles/index.ts`
3. Add to the `inferRole()` regex chain

## Questions?

Open an issue at https://github.com/maia-sdk/maia/issues