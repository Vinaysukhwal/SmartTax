# AGENTS.md — SmartTax Project Instructions

> **This file defines persistent rules for any developer, AI assistant, or sub-agent operating within this repository.** All automated and manual contributions must comply with these directives.

---

## 1. Project Identity

- **Project Name**: SmartTax
- **Domain**: Indian income tax filing and compliance
- **Brand URL**: [https://vinyx.tech](https://vinyx.tech)
- **Assessment Year**: FY 2025-26 / AY 2026-27 (default)
- **Architecture**: Monorepo — `client/` (React + Vite) + `server/` (Express + MongoDB)

---

## 2. Non-Negotiable Rules

### 2.1 Layout & UI Integrity

- **Do not** alter the page routing structure in `client/src/App.jsx` without explicit approval.
- **Do not** remove or rename existing page components in `client/src/pages/`.
- **Preserve** the Navbar → Main Content → Footer → ChatBot layout hierarchy.
- **Maintain** the dark theme color system (`#15121b` base, `#e8dfee` text, purple accent palette).
- **All new pages** must be wrapped in `<ProtectedRoute>` if they require authentication.

### 2.2 Data Model Constraints

- **Never bypass** Mongoose schema validation with raw MongoDB queries.
- **Never store** plaintext passwords — the `User.js` pre-save hook handles hashing.
- **Preserve** the `userId` foreign key relationship on all child models (ItrFiling, Document, Deduction, Notice, Challan).
- **Do not** modify the `ItrFiling` compound index (`userId + assessmentYear`) without migration planning.
- Documents use **base64 encoding** stored directly in MongoDB. This is a deliberate architectural choice for the current project scope.

### 2.3 Tax Computation Accuracy

- **Both client and server** contain tax computation engines. Changes to tax slab rates, rebate logic, or surcharge rules **must be synchronized** across:
  - `client/src/utils/taxCalculations.js`
  - `server/services/autoFillEngine.js`
- **FY 2025-26 slab rates** are currently hardcoded. When updating for a new financial year, update all slab arrays, rebate thresholds, and standard deduction values in both files.
- The Section 87A rebate includes **marginal relief** under the New Regime. Do not simplify this to a flat cutoff.

### 2.4 AI Integration

- The document scanner uses **Google Gemini** with a multi-model fallback chain: `gemini-2.5-flash → gemini-2.0-flash → gemini-2.0-flash-lite`.
- **Maintain** this fallback pattern for quota resilience.
- All Gemini calls must request `responseMimeType: 'application/json'` for structured extraction.
- The system prompt in `documentScanner.js` defines the extraction schema for 6 document types. New document types must follow the same pattern.

### 2.5 Authentication & Security

- JWT tokens are stored in `localStorage` under the key `smarttax_token`.
- The Axios interceptor in `AuthContext.jsx` attaches the token to every API request.
- Server-side JWT verification happens in `server/middleware/auth.js` — all protected routes must use this middleware.
- CORS configuration in `server/index.js` supports comma-separated origins via `CORS_ORIGIN` env var.

---

## 3. File Organization Rules

| What | Where |
|---|---|
| Page-level React components | `client/src/pages/` |
| Shared/reusable UI components | `client/src/components/` |
| React Context providers | `client/src/context/` |
| Client-side utility functions | `client/src/utils/` |
| API configuration (Axios) | `client/src/config/api.js` |
| Express route handlers | `server/routes/` |
| Business logic services | `server/services/` |
| Mongoose data models | `server/models/` |
| Database connection | `server/config/db.js` |
| Auth middleware | `server/middleware/auth.js` |

**One component per file.** Filename must match the default export.

---

## 4. Dependency Management

### Client Dependencies (Locked)

Do not introduce new UI frameworks (Material UI, Chakra, etc.) — the project uses **Tailwind CSS** for all styling. Additional utility libraries are acceptable if they serve a specific, documented need.

### Server Dependencies (Locked)

- **Express 4** — do not upgrade to Express 5 without migration testing.
- **Mongoose 8** — all schema changes must use Mongoose validation, not raw MongoDB drivers.
- **@google/generative-ai** — the official Google Gemini SDK. Do not replace with third-party wrappers.

### Adding Dependencies

When adding a dependency, document:
1. Why the dependency is needed (not just convenience).
2. What existing functionality it replaces or augments.
3. The specific version being pinned.

---

## 5. Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ | Secret key for JWT signing |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key for document scanning & chat |
| `CORS_ORIGIN` | ✅ | Comma-separated allowed frontend origins |
| `PORT` | ❌ | Server port (defaults to `5000`) |

### Client (`client/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend API base URL (e.g., `http://localhost:5000/api`) |

**All new environment variables must be added to `server/.env.example`** with placeholder values and comments.

---

## 6. Commit & PR Standards

- Follow [Conventional Commits](https://www.conventionalcommits.org/).
- Use scopes: `client`, `server`, `auth`, `scanner`, `wizard`, `dashboard`, `models`, `routes`.
- All PRs must include a description of what changed, how to test, and screenshots for UI changes.
- See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

---

## 7. Deployment Architecture

| Component | Platform | Config File |
|---|---|---|
| Frontend | Vercel | `client/vercel.json` |
| Backend API | Render | `render.yaml` |
| Database | MongoDB Atlas | Environment variable |

- The frontend uses SPA rewrites (`vercel.json`) — all routes resolve to `index.html`.
- The backend uses `render.yaml` for automated deployment with environment variable injection.
- **Never commit `.env` files.** They are listed in `.gitignore`.

---

## 8. Testing Expectations

Before submitting any change:

- [ ] `npm run build` completes without errors in `client/`
- [ ] `npm run lint` passes in `client/`
- [ ] `npm run dev` starts without crashes in `server/`
- [ ] Existing routes return expected responses
- [ ] No console errors in the browser dev tools
- [ ] UI renders correctly on viewports ≥ 375px wide

---

*Last updated: June 2026*
