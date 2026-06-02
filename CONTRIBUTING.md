# Contributing to SmartTax

Thank you for your interest in contributing to SmartTax. This document outlines the standards and procedures we follow to maintain a clean, consistent, and high-quality codebase.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branch Naming Convention](#branch-naming-convention)
- [Commit Message Standards](#commit-message-standards)
- [Pull Request Process](#pull-request-process)
- [Code Style Guidelines](#code-style-guidelines)
- [Architecture Guidelines](#architecture-guidelines)

---

## Code of Conduct

By participating in this project, you agree to maintain a welcoming, respectful, and harassment-free environment. We expect all contributors to act professionally and constructively.

---

## Getting Started

### 1. Fork the Repository

```bash
# Fork via GitHub UI, then clone your fork
git clone https://github.com/<your-username>/SmartTax.git
cd SmartTax
```

### 2. Set Upstream Remote

```bash
git remote add upstream https://github.com/Vinaysukhwal/SmartTax.git
git fetch upstream
```

### 3. Install Dependencies

```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 4. Configure Environment

```bash
# Server — copy the example and fill in your values
cd server && cp .env.example .env

# Client — set the API URL
cd ../client
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

### 5. Start Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

---

## Development Workflow

```
main ← PR ← feature/your-feature-name
```

1. **Sync** your fork with upstream `main` before starting work.
2. **Create** a feature branch from `main`.
3. **Develop** with small, focused commits.
4. **Test** locally — verify both client and server work together.
5. **Push** your branch and open a Pull Request.
6. **Respond** to code review feedback.
7. **Merge** happens after maintainer approval.

---

## Branch Naming Convention

Use descriptive, prefixed branch names:

| Prefix | Purpose | Example |
|---|---|---|
| `feature/` | New feature or module | `feature/gst-calculator` |
| `fix/` | Bug fix | `fix/tds-computation-error` |
| `refactor/` | Code restructuring (no behavior change) | `refactor/auth-context-cleanup` |
| `docs/` | Documentation updates | `docs/api-endpoint-reference` |
| `style/` | UI/CSS-only changes | `style/dashboard-dark-mode` |
| `perf/` | Performance improvement | `perf/document-scanner-caching` |
| `test/` | Adding or updating tests | `test/tax-calculation-coverage` |

---

## Commit Message Standards

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear, parseable commit history.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `chore` | Build, tooling, dependency updates |

### Scopes

Use the component or module name: `client`, `server`, `auth`, `scanner`, `wizard`, `dashboard`, `models`, `routes`.

### Examples

```bash
feat(scanner): add support for Form 16A document parsing
fix(wizard): correct marginal relief calculation for income above 12L
refactor(server): extract tax computation into standalone service module
docs(readme): update installation instructions for MongoDB Atlas
style(dashboard): improve card spacing on mobile viewports
chore(deps): bump mongoose from 8.7 to 8.8
```

---

## Pull Request Process

### Before Opening a PR

- [ ] Branch is up to date with `upstream/main`
- [ ] Code builds without errors (`npm run build` in client)
- [ ] ESLint passes (`npm run lint` in client)
- [ ] Server starts cleanly (`npm run dev` in server)
- [ ] All existing functionality still works
- [ ] New environment variables are documented in `.env.example`

### PR Template

When opening a PR, include:

```markdown
## Summary
Brief description of the change.

## Type of Change
- [ ] Feature
- [ ] Bug Fix
- [ ] Refactor
- [ ] Documentation
- [ ] Other

## Changes Made
- File-level list of modifications

## How to Test
Step-by-step instructions to verify the change.

## Screenshots (if UI changes)
Before/After screenshots.
```

### Review Process

1. At least **one maintainer approval** is required before merging.
2. All CI checks must pass.
3. PR title should follow Conventional Commit format.
4. Squash commits if the branch has more than 5 commits.

---

## Code Style Guidelines

### JavaScript / JSX

- Use **ES module** syntax (`import/export`) in the client.
- Use **CommonJS** (`require/module.exports`) in the server.
- Use `const` by default; `let` only when reassignment is necessary.
- Prefer **arrow functions** for callbacks and component handlers.
- All components must be **functional** (no class components).
- Destructure props at the function parameter level.

### File Organization

- **One component per file** — filename must match the default export.
- Page components go in `client/src/pages/`.
- Shared/reusable components go in `client/src/components/`.
- Utility functions go in `client/src/utils/`.
- API route handlers go in `server/routes/`.
- Business logic goes in `server/services/`.
- Database schemas go in `server/models/`.

### CSS / Styling

- Use **Tailwind CSS** utility classes for all styling in the client.
- Avoid inline `style` objects unless dynamically computed.
- Custom CSS goes in `client/src/index.css` using `@layer` directives.

### Comments & Documentation

- All files must have a JSDoc header comment explaining their purpose.
- All exported functions must have JSDoc `@param` and `@returns` documentation.
- Non-obvious business logic (tax calculations, regime rules) must be commented.
- Do **not** remove existing comments when modifying files.

---

## Architecture Guidelines

### Client

- Use **React Context** for global state (auth, loading). Do not introduce Redux or Zustand without discussion.
- Use **React Router** for navigation — all routes are defined in `App.jsx`.
- API calls go through the centralized `config/api.js` Axios instance.
- Tax computation logic is duplicated on both client and server intentionally — the client-side engine powers the calculator UI, while the server-side engine handles auto-fill compilation.

### Server

- Follow **RESTful conventions** for route design.
- Use the `auth` middleware on all protected routes.
- Mongoose models define validation rules — do not bypass them with raw MongoDB operations.
- The document scanner uses a **model fallback chain** (Gemini 2.5 Flash → 2.0 Flash → 2.0 Flash Lite) for quota resilience. Maintain this pattern for any new AI features.
- The database connection module implements **retry logic** — do not replace it with a single-attempt connection.

### Data

- **Never store plaintext passwords.** The User model pre-save hook handles bcrypt hashing.
- Documents are stored as **base64** in MongoDB. This is intentional for the current scale. If migrating to cloud storage (S3), update both the Document model and the `/api/documents` routes.
- Each filing is scoped to a **userId + assessmentYear** compound index. Do not create duplicate filings for the same AY.

---

## Questions?

If you're unsure about anything, open a [GitHub Discussion](https://github.com/Vinaysukhwal/SmartTax/discussions) or reach out to the maintainers before writing code. We'd rather answer a question early than review a PR that goes in the wrong direction.

---

<div align="center">

**Thank you for helping make SmartTax better for Indian taxpayers. 🇮🇳**

</div>
