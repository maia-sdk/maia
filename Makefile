# Maia SDK — developer workflow
# Run `make help` to see available targets.

PYTHON_PACKAGES = packages/acp-py packages/sdk-py packages/cli-py packages/connector-adapters

.PHONY: help install install-js install-py build build-js build-py test test-js test-py lint clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ── Full stack ───────────────────────────────────────────────────

install: install-js install-py ## Install all dependencies (JS + Python)

build: build-js build-py ## Build all packages

test: test-js test-py ## Run all tests

# ── JavaScript / TypeScript ──────────────────────────────────────

install-js: ## Install JS dependencies (npm workspaces)
	npm install

build-js: ## Build all JS/TS packages
	npm run build

test-js: ## Run JS/TS tests
	npm test

lint: ## Lint all JS/TS packages
	npm run lint

# ── Python ───────────────────────────────────────────────────────

install-py: ## Install Python packages in editable mode
	@echo "Installing Python packages (editable)..."
	pip install -e packages/acp-py
	pip install -e packages/connector-adapters
	pip install -e packages/sdk-py
	pip install -e packages/cli-py

build-py: ## Build Python wheels
	@for pkg in $(PYTHON_PACKAGES); do \
		echo "Building $$pkg..."; \
		python -m build "$$pkg" --outdir dist/; \
	done

test-py: ## Run Python tests
	python test_sdk.py

clean: ## Remove all build artifacts
	rm -rf packages/*/dist dist/
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name '*.egg-info' -exec rm -rf {} + 2>/dev/null || true