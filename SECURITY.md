# SmartTax — Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest (main) | ✅ |

## Reporting a Vulnerability

If you discover a security vulnerability in SmartTax, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, email the maintainer directly at **vinaysukhwal@gmail.com** with:

1. A description of the vulnerability
2. Steps to reproduce the issue
3. Potential impact assessment
4. Suggested fix (if any)

You will receive a response within **48 hours** acknowledging receipt, and a follow-up within **7 days** with a plan for remediation.

## Scope

The following areas are in scope for security reports:

- **Authentication** — JWT token handling, password hashing, session management
- **API Security** — Route authorization, input validation, CORS configuration
- **Data Protection** — PAN numbers, user data, document storage
- **AI Integration** — Gemini API key handling, prompt injection

## Out of Scope

- The demo account (`demo@smarttax.com`) is intentionally public
- Base64 document storage is a known architectural limitation (documented in AGENTS.md)
- Rate limiting is not yet implemented (planned for future release)

## Acknowledgments

We appreciate responsible disclosure and will credit security researchers (with permission) in our release notes.
