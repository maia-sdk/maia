# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public issue**
2. Email **security@maia.ai** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge your report within 48 hours and aim to release a fix within 7 days for critical issues.

## Scope

This policy covers:
- All packages in the `@maia/*` npm scope
- All packages in the `maia-*` PyPI namespace
- The Maia CLI tools
- The ACP protocol implementation

## Security Practices

- No credentials are hardcoded in source
- API tokens are passed via environment variables or config objects
- Optional dependencies (pg, @aws-sdk/*) are dynamically imported
- The connector HTTP layer never logs request/response bodies by default
- SSE stream parsing rejects malformed payloads

## Hall of Fame

We appreciate responsible disclosure. Contributors who report valid vulnerabilities will be credited here (with permission).