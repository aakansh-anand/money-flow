# Kosh — Personal Finance PRD

Oct 18, 2026 · @Aakansh Anand · Revised Oct 18, 2026 (decisions locked: Postgres + Drizzle, multi-session auth, partial debt payments, email verification deferred)

Kosh consolidates cash, two bank accounts (Paytm/Kotak), and Groww investments into one tracker with monthly categorized reports and creditor/debtor tracking — replacing the manual Excel reconciliation. Stack: React Native (mobile) + Next.js (web) + NestJS API + Postgres (Neon free tier) with Drizzle ORM.

## Goals & MVP Scope

v1 replaces the end-of-month Excel reconciliation: every rupee moved through Cash, Bank 1, or Bank 2 is logged once, tagged, and rolled up automatically.

**In scope (v1)**

- Log expense/income against Cash, Bank 1, or Bank 2, each tagged (Meal, Snacks, Entertainment, Medical, Financial Service, Clothing, etc.)
- Track who owes you and who you owe, per person, with partial repayments and a settled/open status
- Record investments (Groww, RD/FD, Mutual Funds) and see total invested + current value
- Auto-generate the monthly breakdown: expense/income by category, net position per account, and outstanding debt summary

**Out of scope (v1)**

- Automatic bank/SMS/UPI statement import — manual entry only
- Household/shared tracking in v1 — the app **is** multi-user (friends register their own accounts, each sees only their own data), but partner sharing and expense splitting are v2 (see Post-v1 Scope)
- Budgets, goals, recurring-transaction automation, bill reminders
- Multi-currency (INR only)
- Email verification (deferred — see Resolved Decisions)

## Tech Stack

Versions below are the latest stable of each tool, verified Oct 18, 2026 against the npm registry, Expo docs, the Node.js release schedule, and Neon docs.

| Layer           | Choice                                  | Version              | Notes                                                                                                                                                                                 |
| --------------- | --------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime         | Node.js                                 | 24 LTS (24.22.x)     | Active LTS; Node 26 turns LTS Oct 28, 2026 — fine to move then                                                                                                                        |
| Monorepo        | pnpm + Turborepo                        | 12.14 / 2.11         | pnpm workspaces + turbo task pipelines                                                                                                                                                |
| Language        | TypeScript                              | 5.9.x                | TS 7 (native) is out, but typescript-eslint doesn't support it yet (wants `<6.1`) — staying on 5.9 until the lint toolchain catches up                                                |
| Mobile          | Expo SDK + React Native + React         | SDK 58 / 0.88 / 19.3 | SDK 58 pins RN 0.88 exactly; requires Node ≥ 22.13; EAS Build for distribution; scaffold new projects with `create-expo-app --template default@sdk-58` until store Expo Go catches up |
| Web             | Next.js (App Router) + React            | 16.4 / 19.3          | Dashboard + monthly reports; same React mental model as mobile                                                                                                                        |
| Backend         | NestJS                                  | 12.1                 | REST API, custom auth (bcrypt 6 + `@nestjs/jwt` 12), owns all reads/writes to Postgres                                                                                                |
| ORM             | Drizzle ORM + drizzle-kit               | 0.45 / 0.31          | Type-safe SQL ORM; schema in `packages/db`, migrations via drizzle-kit; postgres.js 3.4 driver                                                                                        |
| Database        | Postgres on Neon, free tier             | Postgres 18          | PG 18 is Neon's default for new projects; doesn't pause the way Supabase's free tier does; swappable — it's just Postgres                                                             |
| Auth            | Custom (NestJS)                         | —                    | bcrypt-hashed passwords, short-lived access JWT + rotating refresh token, one row per device in `sessions`                                                                            |
| State (client)  | Redux Toolkit (RTK Query) + react-redux | 2.13 / 9.3           | Already your default; use for both RN and Next.js data fetching                                                                                                                       |
| Validation      | Zod                                     | 4.6                  | Shared schemas in `packages/shared`, kept in sync with Drizzle table definitions                                                                                                      |
| Lint            | ESLint (flat config)                    | 10.x                 | Shared via `packages/config`                                                                                                                                                          |
| Backend hosting | Fly.io (free tier)                      | —                    | Machines auto-stop/start in ~1s on request — a better fit than Render's 30–60s cold start                                                                                             |
| Web hosting     | Vercel                                  | —                    | Native Next.js support, free tier covers this easily                                                                                                                                  |

Supabase is dropped entirely — with custom auth and Neon Postgres there's nothing left for it to do. Neon's free tier doesn't pause, and Postgres means the monthly report is a plain SQL `GROUP BY` instead of a hand-built aggregation pipeline. Fly.io's free Machines cover the remaining piece, waking in about a second, so daily use won't feel it.

## System Architecture

Mobile and web both authenticate directly against NestJS, which issues its own access and refresh JWTs on register/login — and is the only thing that talks to Postgres, for auth and every other read/write.

## Database Schema

| Table                  | Purpose                                                           | Key fields                                                                                                         |
| ---------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| users                  | Account credentials                                               | id, email, passwordHash, createdAt                                                                                 |
| sessions               | One row per active device/session                                 | id, userId, tokenHash, deviceLabel, userAgent, lastUsedAt, createdAt, expiresAt, revokedAt                         |
| accounts               | Cash + bank accounts                                              | id, userId, type (cash/bank), subtype (free-text label, banks only), name, openingBalance, currentBalance          |
| tags                   | Expense/income categories, user-defined                           | id, userId, name, kind (expense/income), color                                                                     |
| transactions           | Every expense/income/transfer                                     | id, userId, type (expense/income/transfer), accountId, fromAccountId, toAccountId, tagId, amount, note, occurredAt |
| investmentTypes        | User-defined investment categories (FD, Stocks, Gold, Bitcoin, …) | id, userId, name, currentValue                                                                                     |
| investmentTransactions | Every invest/withdraw event against a category                    | id, userId, investmentTypeId, instrumentName, type (invest/withdraw), amount, occurredAt, note                     |
| contacts               | People, banks, or institutions in a debt                          | id, userId, name, type (person/bank/institution)                                                                   |
| debts                  | Money lent or borrowed                                            | id, userId, contactId, direction (lent/borrowed), amount, status (open/settled), dueDate, createdAt, settledAt     |
| debtPayments           | Every repayment against a debt                                    | id, userId, debtId, amount, paidAt, note                                                                           |

Every table carries `userId` — v1 is multi-user (you plus friends with their own accounts), and there's no RLS in play, so every query handler filters by `userId` explicitly. That scoping is the entire data-isolation boundary between users; it's on the API layer to enforce consistently, not the database. `transactions` uses `accountId` for expense/income and `fromAccountId`/`toAccountId` for transfers, which covers account-to-account moves and ATM withdrawals (bank → cash). `accounts.subtype` is a free-text user label ("Salary", "Chai fund", whatever) with no effect on balance math. `investmentTypes` and `tags` are both user-extensible lists rather than fixed enums. An investment category's invested total is computed by summing its `investmentTransactions` (invest minus withdraw), not stored — `investmentTypes.currentValue` is a separate field you update by hand for mark-to-market, kept distinct from that running total. `accounts.currentBalance` is maintained by the API inside a DB transaction on every write, not recomputed per read.

**Debt lifecycle:** remaining balance = `debts.amount` − `SUM(debtPayments.amount)`. Each repayment is a `debtPayments` row, so every debt keeps a full history — when it was taken, each repayment (date, amount, note), and what's left. When the remaining balance hits zero the API sets `status=settled` and `settledAt` automatically. The record is **kept** — marked completed, removed from the open list, still visible in history — never hard-deleted on completion. Open debts can also be edited or deleted manually.

**Sessions:** one `sessions` row per logged-in device. The access JWT carries `sub` + `sid` (session id), so the profile screen can list all active sessions, flag the current one, and revoke any other.

## API Routes

| Resource                | Routes                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth                    | `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/sessions` · `DELETE /auth/sessions/:id`                                          |
| Accounts                | `GET /accounts` · `POST /accounts` · `PATCH /accounts/:id`                                                                                                                            |
| Transactions            | `GET /transactions?accountId&tagId&from&to` · `POST /transactions` (type: expense/income/transfer) · `PATCH /transactions/:id` · `DELETE /transactions/:id`                           |
| Tags                    | `GET /tags` · `POST /tags` · `PATCH /tags/:id`                                                                                                                                        |
| Investment Types        | `GET /investment-types` · `POST /investment-types` · `PATCH /investment-types/:id` (update `currentValue`)                                                                            |
| Investment Transactions | `GET /investment-transactions?investmentTypeId` · `POST /investment-transactions` (type: invest/withdraw)                                                                             |
| Contacts                | `GET /contacts` · `POST /contacts`                                                                                                                                                    |
| Debts                   | `GET /debts?status=open` · `POST /debts` (direction: lent/borrowed) · `GET /debts/:id` (with payment history) · `PATCH /debts/:id` · `DELETE /debts/:id` · `POST /debts/:id/payments` |
| Reports                 | `GET /reports/monthly?month=2026-10` — category breakdown, per-account net, open-debt summary in one call                                                                             |

Auth is real surface area, not a pass-through: `/auth/register` hashes the password with bcrypt, creates the user, and returns a token pair immediately (email verification deferred — no transactional-email provider in v1); `/auth/login` verifies credentials and issues an access JWT (short-lived, ~15 min, carrying `sub` + `sid`) plus a refresh token, stored hashed in `sessions` and rotated on each use (reuse of a rotated token revokes the whole session); `/auth/refresh` exchanges a valid refresh token for a new pair; `/auth/logout` revokes the current session; `/auth/sessions` lists active devices; `DELETE /auth/sessions/:id` revokes any one of them. Every other route is scoped to the authenticated user via the access JWT's `sub` claim. **Transport:** the refresh token is delivered both as an `httpOnly; Secure; SameSite=None` cookie and in the JSON body — web uses the cookie (XSS-proof), mobile uses either the RN native cookie store or the body token from secure storage; `/auth/refresh` accepts it from either. Cookie-authed routes get CSRF protection (SameSite + custom-header check), and CORS runs with `credentials: true` against an explicit origin allowlist. If web and API later share a parent domain (app._/api._), the cookie becomes first-party and `SameSite=Lax`.

## User Flows & Screens

### Onboarding & Auth

1. Sign up (email + password) → logged in immediately (verification deferred)
2. First-run setup: add bank account(s) (name + your own label, e.g. salary / savings / primary expense) → add investment categories with an opening amount → add cash balance → add any existing creditors/debtors

### Navigation

Sidebar (web) / tab bar (mobile): **Home** · **Transactions** · **Investments** · **Debt Balance** — accounts, tags, investment types, and session management live in Settings, reached off the same nav, not a primary tab of its own.

### Home

Dashboard: **Total liquid** (cash + all banks) · **Total Investments** · **Net Debt/Credit** (green if net owed to you, red if net owed by you) — plus **Add Expense** / **Add Income** buttons.

### Add Expense / Add Income

| Field           | Add Expense                                        | Add Income                                                     |
| --------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| Amount          | required                                           | required                                                       |
| Reason / source | free text                                          | free text                                                      |
| Tag             | pick one, or “+ Add tag” to create one on the spot | pick one, or “+ Add tag” (Cashback, ROI, Salary, Gave back, …) |
| Account         | which bank or Cash it left                         | which bank or Cash it landed in                                |

### Transactions

Calendar-month table with a date filter; the filtered income/expense totals sit above it. Income is always green, expenses always red (Design System, above). Each row opens a detail page — account, tag, note. “Load more” pages in older rows at the bottom; true infinite auto-scroll would fight the “check previous month” framing below it, so this is a button, not a scroll listener. On the 1st of a new month, a banner offers to jump straight to last month's view.

### Investments

A dashboard of your own categories (FD, Stocks, Gold, …), each showing its running total. **Add Investment** and **Add Withdrawal** open the same form: category, instrument, amount, note.

### Debt Balance

Dashboard with **Add Debt** (you owe someone) and **Add Credit** (someone owes you) — amount + contact name + optional due date. “See statement” opens a table: Name · Remaining balance · **Record a payment**. Each debt opens a detail view: original amount and date taken, full repayment history (date, amount, note), and the remaining balance. Recording a payment subtracts from the balance; when it reaches zero the debt auto-completes and moves to a Completed view, history intact. Open debts can be edited or deleted.

### Settings — Sessions

Profile section lists every active session (device, last used), flags “This device”, and lets you revoke any other session remotely.

## Design System

| Token                 | Light   | Dark    | Use                                                                                |
| --------------------- | ------- | ------- | ---------------------------------------------------------------------------------- |
| Primary               | #0F766E | #14B8A6 | Buttons, active nav, links                                                         |
| Background            | #F8FAFC | #0F172A | Screen background                                                                  |
| Surface               | #FFFFFF | #1E293B | Cards, list rows                                                                   |
| Text primary          | #0F172A | #F1F5F9 | Headings, amounts                                                                  |
| Text secondary        | #64748B | #94A3B8 | Labels, timestamps                                                                 |
| Income / positive     | #16A34A | #22C55E | Income amounts, settled debts                                                      |
| Expense / negative    | #DC2626 | #F87171 | Expense amounts                                                                    |
| Investment            | #2563EB | #60A5FA | Investment values                                                                  |
| Due / warning         | #D97706 | #FBBF24 | Open debts past due date                                                           |
| Lending (owed to you) | #10B981 | #34D399 | Debt amounts where someone owes you — emerald, distinct from everyday income green |
| Debt (you owe)        | #E11D48 | #FB7185 | Debt amounts you owe — rose, distinct from everyday expense red                    |
| Border                | #E2E8F0 | #334155 | Dividers, input borders                                                            |

Typography: Inter (or Manrope) throughout — 24/600 for amounts on the home screen, 16/400 body, 13/500 labels. Amounts are never ambiguous: always signed with color (green `+`, red `−`), never color alone, since that's the one thing this app exists to make scannable at a glance.

## Repo Structure

One pnpm 12 + Turborepo 2 monorepo on Node 24 LTS — shared types and Zod schemas move in lockstep across mobile, web, and API instead of drifting across three repos.

- `apps/mobile` — React Native (Expo)
- `apps/web` — Next.js
- `apps/api` — NestJS
- `packages/shared` — Zod schemas, TypeScript types, API client used by both `apps/mobile` and `apps/web`
- `packages/db` — Drizzle schema, migrations (drizzle-kit), and connection setup, imported only by `apps/api`
- `packages/config` — shared ESLint/TSConfig

`packages/shared`'s Zod schemas are the single definition of what a transaction or a debt looks like — NestJS DTOs and RTK Query's client types both derive from them, so a schema change can't update one surface and silently break another.

## Monthly Reporting & Analytics

`GET /reports/monthly?month=2026-10` replaces the manual Excel pass end to end, computed server-side from `transactions`, `debts`, and `investments` — not recomputed by hand each month:

- **Category breakdown** — expense and income summed per tag, that month
- **Per-account net** — money in vs out for Cash, Bank 1, Bank 2 individually
- **Net worth snapshot** — Cash + Bank 1 + Bank 2 + total investments − open debts owed by you
- **Open debts** — who owes you, who you owe, grouped by person, with remaining amounts

The web `/reports/monthly` route renders this as the thing you used to build in Excel; mobile skips it entirely — nobody builds a monthly report on a phone. Postgres keeps this a readable SQL `GROUP BY` per tag and per account.

## Resolved Decisions

- **Database** — Postgres on Neon (free tier) + Drizzle. Locked. Any other Postgres host works later with a connection-string change.
- **Sessions** — multiple concurrent sessions (one `sessions` row per device); profile shows active sessions with per-session revoke; current session flagged via the `sid` claim.
- **Debt settlement** — partial payments via `debtPayments`, with full repayment history; auto-settled when remaining hits zero; completed records retained, never hard-deleted.
- **Email verification** — deferred past v1; register → immediate login. `/auth/verify-email` and a transactional-email provider (Resend/SES) land when the app gains real users.
- **Investment value** — your own running total from logged transactions, plus a manually updated `currentValue` for mark-to-market. No live market-price integration.
- **Pagination** — “Load more” button, not infinite scroll.
- **Local dev database** — Postgres runs in a local Docker container (`postgres:18-alpine`, matching Neon's default major) via a root `docker-compose.yml`; Neon is provisioned only at deploy time. The switch is a `DATABASE_URL` change plus `drizzle-kit migrate` — same postgres.js driver works against both over TCP, no code changes.
- **Multi-user from day one** — not a single-user app; friends register their own accounts. Data isolation is per-user via `userId` scoping in the API. Shared/household views remain out of scope.

## Post-v1 Scope (Parked)

Not built in v1, but decided in advance so they don't get lost:

- **Shared spaces (partner sharing)** — share your data with a partner (e.g. your fiancée): read visibility into your transactions/accounts/dashboard, plus jointly recorded **shared expenses** with split tracking (who paid, who owes what share). Likely a `spaces`/`spaceMembers` model layered over the existing per-user data, with split balances settling alongside the existing debts feature. The v1 `userId`-scoped schema and per-table isolation are designed so this adds a layer rather than forcing a rewrite.
- **Email verification** — `/auth/verify-email` + transactional provider (Resend/SES); becomes more important as the friend circle grows beyond people you can vouch for.
- **Redis** — add when load justifies it, for: report/dashboard response caching, distributed rate limiting (once the API runs multiple replicas), session/token store if the Postgres `sessions` table ever becomes hot, and as the BullMQ backing store the moment any background job lands. Until then it's deliberately omitted — v1's load doesn't justify the infra.
- **Recurring transactions, budgets/goals, bill reminders** — all need scheduled jobs (that's the BullMQ/Redis trigger above).
- **Automatic bank/SMS/UPI import** — background sync workers; same queue story.
