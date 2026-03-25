# Changelog

All notable changes to the Maia SDK will be documented in this file.

This project follows [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-03-25

### Added
- **@maia/acp** — Agent Collaboration Protocol client (TypeScript + Python)
  - 6 ACP primitives: message, handoff, review, artifact, activity, capabilities
  - SSE stream parser and event builder
  - ACPClient with event buffering, threading, cost tracking
- **@maia/brain** — Multi-agent orchestration runtime
  - Brain class with plan → execute → converse → review → revise loop
  - 27 built-in agent roles with distinct personalities
  - LLM caching, multi-provider failover, structured output
  - Guardrails (injection, PII, custom rules)
  - Evaluation framework with 5 scorers
  - OpenTelemetry auto-instrumentation
  - Cross-run agent memory
- **@maia/theatre** — Live agent visualization (React)
  - 15 visual surfaces (browser, document, editor, email, terminal, etc.)
  - 49 connector skins with branded palettes
  - Replay controls, cost bar, activity timeline
  - useACPStream and useReplay hooks
- **@maia/teamchat** — Agent conversation UI
  - Chat bubbles with intent coloring
  - Review badges, typing indicators
  - useConversationStream hook
- **@maia/computer-use** — Browser automation via Playwright
  - navigate, click, type, scroll, extract, screenshot
  - ACP event emission on every action
- **@maia/connectors** — 49 pre-built SaaS connectors
  - Real HTTP implementations for Gmail, Slack, GitHub, Jira, Stripe, etc.
  - BaseConnector with auth injection and ACP event emission
  - Optional peer deps for PostgreSQL, AWS SDK
- **@maia/cli** — Node.js CLI (stream, replay, validate, info)
- **@maia/sdk** — Bundle package (ACP + Theatre + TeamChat)
- **maia-sdk** — Python bundle (ACP + adapters)
- **maia-cli** — Python CLI (stream, replay, validate, emit, init, serve, info)
- **maia-adapters** — Framework adapters for LangChain, CrewAI, AutoGen
- **acp-spec** — JSON Schema definitions for ACP v1

### Infrastructure
- Monorepo with pnpm workspaces + npm workspaces
- CI/CD: GitHub Actions for Node 18/20/22 + Python 3.10/3.11/3.12
- Publish workflow for npm + PyPI on GitHub release
- Makefile with install/build/test/lint/clean targets