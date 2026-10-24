# Student Finance Tracker — Frontend Specification

> **Status:** Implementation specification / development prompt. This document describes the **target frontend**, not features already implemented. The frontend must connect to the real FastAPI backend using SQLite (`sqlite3`) and MongoDB (PyMongo). Backend endpoints listed here are proposed contracts and must be verified against the repository.

## 1. Product Goal

Build a responsive, accessible, premium **light Neumorphism (Soft UI)** student finance dashboard with a distinctive **Live Database Query Studio** in the left sidebar. Users must be able to select a database and dataset, enter data, preview the generated SQL/MongoDB operation, click **Execute Query**, and immediately inspect the **actual persisted data** and resulting changes to the dashboard.

**Core demo flow:** Select database → Select table/collection → Select operation → Enter values → Preview query and parameters → Execute through FastAPI → See status and results → Refresh live data and related charts.

Never represent mock or simulated query execution as a successful real database operation.

## 2. Frontend Technology Stack

| Area | Choice | Purpose |
| --- | --- | --- |
| Framework | React + TypeScript | Component architecture and type safety |
| Tooling | Vite | Local development and production builds |
| Styling | Tailwind CSS | Consistent responsive styles |
| Components | shadcn/ui | Accessible component primitives |
| Icons | Lucide React | Consistent iconography |
| Animations | Motion / Framer Motion | Subtle interactions |
| Charts | Recharts | Finance analytics |
| Routing | React Router | Client-side routes |
| Server state | TanStack Query | Fetching, caching, invalidation |
| Forms | React Hook Form + Zod | Forms and validation |
| HTTP | Axios | Typed API client |
| Query preview | Monaco Editor | Syntax-highlighted SQL and MongoDB operations |
| Notifications | Sonner | Success/error toasts |
| Optional ER diagrams | React Flow | Schema relationship visualization |

Backend integration: **FastAPI → SQLite via Python `sqlite3`** and **MongoDB via PyMongo**. Do not introduce SQLAlchemy or MySQL into the target implementation.

## 3. Design System — Light Neumorphism

### Color tokens

| Token | Hex | Use |
| --- | --- | --- |
| Canvas | `#E9EEF5` | Main background |
| Surface | `#EDF2F8` | Cards and sidebar |
| Primary | `#7C83FD` | Selected items, CTA |
| Secondary | `#A8B8FF` | Accent highlights |
| Success | `#48BFA7` | Successful operations |
| Warning | `#F5B971` | Budget warning |
| Danger | `#F08080` | Errors and destructive actions |
| Text | `#263247` | Primary text |
| Muted | `#78869A` | Secondary text |
| Highlight | `#FFFFFF` | Raised-surface highlight |

Fonts: **Plus Jakarta Sans** (headings), **Inter** (body), **JetBrains Mono** (queries).

```css
:root {
  --canvas: #E9EEF5;
  --surface: #EDF2F8;
  --primary: #7C83FD;
  --text: #263247;
  --muted: #78869A;
  --raised: 8px 8px 18px #cbd3df, -8px -8px 18px #ffffff;
  --inset: inset 5px 5px 10px #cbd3df, inset -5px -5px 10px #ffffff;
}
.soft-card { background: var(--surface); border-radius: 24px; box-shadow: var(--raised); }
.soft-input { background: var(--surface); border-radius: 12px; box-shadow: var(--inset); }
```

Use 20–24px card radii, spacious padding, soft elevation, inset selected navigation and form fields, 150–300ms transitions, restrained lavender accents, and crisp typography. **Never rely on shadows alone** for state: provide labels, visible focus outlines, high-contrast text, error messaging, and `prefers-reduced-motion` support. Avoid dark theme, harsh gradients, excessive glassmorphism, and animation overload.

## 4. Application Layout and Navigation

Persistent collapsible desktop sidebar (~250px), top bar (search, notifications, profile), scrollable main content. Mobile: accessible slide-out drawer and stacked content.

**Finance:** Dashboard, Transactions, Income, Expenses, Budgets, Analytics.

**Database Lab:** **Live Query Studio** (prominent), SQL Explorer, MongoDB Explorer, Schema Viewer, Query History.

**System:** Settings.

Use pressed neumorphic styling and a clear accent indicator for the active route. Provide keyboard-accessible navigation.

## 5. Finance Pages

### Dashboard

- Greeting, month selector, and **Add Transaction** CTA.
- Summary cards: **Total Balance**, **Monthly Income**, **Monthly Expenses**, **Budget Remaining**; show trends only when supported by data.
- Recharts: income vs expenses, spending by category (donut), monthly expenses (bars), budget progress.
- Recent transactions table with link to details.
- Format monetary values as INR (`₹`) and dates in the user's locale.
- On mutations, invalidate/reload the affected TanStack Query keys; no fake instant totals.

### Transactions / Income / Expenses

- Add, view, edit, and delete transactions.
- Form fields: transaction type, amount, category, description, date, payment method.
- Search, date/category/type filters, sorting, pagination, confirmation for delete.
- Zod validation, explicit loading/empty/error states, toasts after backend confirmation.

### Budgets

- Create, edit, delete budgets by category/period.
- Show limit, spent, remaining, utilization, and actual backend alerts.
- Green/amber/red status must also include text/icon (not color alone).

### Analytics

- Month/category filters, spending trends, category breakdown, and income/expense comparison.
- Charts must use API data and have accessible summaries.

## 6. Signature Feature — Live Database Query Studio

**The most important page.** A three-panel layout on desktop, stacked panels on mobile:

```text
┌────────────────────┬───────────────────────────┬─────────────────────────┐
│ OPERATION BUILDER  │ QUERY PREVIEW             │ LIVE DATA / RESULTS     │
│ Database selector  │ Generated SQL or MongoDB  │ Real database rows/docs │
│ Table / collection │ Bound parameters          │ Refresh / pagination    │
│ Operation selector │ [Execute Query]           │ Execution status        │
│ Dynamic form       │ Duration / affected rows  │ Updated record(s)       │
└────────────────────┴───────────────────────────┴─────────────────────────┘
```

### 6.1 Selection and data entry

1. Choose **SQLite** or **MongoDB**.
2. Fetch available **allowlisted** tables or collections from backend metadata.
3. Select operation; render fields based on backend schema and supported types.
4. Validate form values and show generated query **before execution**.
5. Display parameter bindings separately; never interpolate user values into executable SQL.
6. Disable Execute during requests; show loading, failure, and success with backend-supplied details.
7. After success, refresh live records, query history, and relevant dashboard caches.

### 6.2 SQLite operations

- **INSERT:** form → preview → insert → show new record and refreshed table.
- **SELECT:** choose columns, conditions, ordering, and limit → results grid.
- **UPDATE:** select record, edit permitted fields → preview → execute → refresh.
- **DELETE:** select record → explicit confirmation → execute → refresh.
- **JOIN:** visual builder from **real foreign-key relationships**; show generated SQL and joined result table.
- **Aggregations:** COUNT, SUM, AVG, MIN, MAX, GROUP BY; results as table, optional chart.

Examples (illustrative names; adjust to the actual schema):

```sql
INSERT INTO expenses (amount, category, description, date)
VALUES (?, ?, ?, ?);
-- Parameters: [250, "Food", "Lunch", "2026-10-24"]

SELECT * FROM expenses WHERE amount > ? ORDER BY amount DESC LIMIT 10;
-- Parameters: [100]

UPDATE expenses SET amount = ? WHERE expense_id = ?;
-- Parameters: [300, 14]

DELETE FROM expenses WHERE expense_id = ?;
-- Parameters: [14]

SELECT category, SUM(amount) AS total_spent
FROM expenses GROUP BY category;
```

**Trigger demonstration:** list actual SQLite triggers returned by backend metadata; let users insert an expense and inspect any resulting budget alert records. Never simulate trigger side effects. Enable SQLite foreign-key enforcement in each backend connection (`PRAGMA foreign_keys = ON`).

### 6.3 MongoDB operations

- Allowlisted collection selector and document input (validated JSON form).
- Support **insertOne, find, updateOne, deleteOne, aggregate**.
- Aggregation builder: `$match`, `$group`, `$sort`, `$limit`, `$project` only where allowed.
- Display a human-readable MongoDB operation preview and the actual returned documents.

```javascript
// Preview only; backend executes a validated structured operation
 db.financial_insights.insertOne({
  category: "Food", monthly_total: 3200, month: "2026-10"
});
```

### 6.4 Execution feedback and live records

Show: database, dataset, operation, query preview, parameters, execution status, backend-reported duration, affected count, returned data, and any validation/DB errors. Provide refresh, loading, empty state, sorting, and pagination. Never fabricate durations or success messages. Only show persisted updates after backend confirmation.

### 6.5 Query history

Record backend-provided ID, timestamp, database, operation, preview, status, duration, and affected count. Add search/filter, inspect, copy, and reuse. Clearly distinguish server-persisted history from browser-only history if persistence is unavailable.

## 7. Database Schema Viewer

**SQLite:** table list, columns/types, primary/foreign keys, indexes, relationships; optional React Flow ER diagram driven by actual backend schema.

**MongoDB:** collection list, document counts, sample shapes, available indexes. Do not invent relationships or columns.

## 8. API Contracts (Proposed; Verify Against Backend)

```text
GET    /api/dashboard/summary
GET    /api/transactions
POST   /api/transactions
PUT    /api/transactions/{id}
DELETE /api/transactions/{id}
GET    /api/budgets
POST   /api/budgets
PUT    /api/budgets/{id}
DELETE /api/budgets/{id}
GET    /api/database/schema
GET    /api/database/tables/{table}/rows
GET    /api/database/triggers
POST   /api/query/sql/execute
POST   /api/query/mongodb/execute
GET    /api/query/history
```

Use typed request/response contracts. Suggested structured execution request (do **not** send raw arbitrary SQL from the browser):

```json
{
  "database": "sqlite",
  "table": "expenses",
  "operation": "insert",
  "values": {"amount": 250, "category": "Food", "description": "Lunch"}
}
```

Backend should return the actual generated parameterized SQL and bindings (where safe), success/error, affected rows, record(s), and execution time. A preview endpoint may be added if server-side query generation is needed before execution. Inspect and reuse existing FastAPI routes first; document missing endpoints instead of faking them.

Frontend `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Never expose credentials or secret keys in `VITE_` variables.

## 9. Security and Reliability

- Execute all operations on the backend, never in the browser.
- Use SQLite parameter placeholders (`?`) for **values**; validate/allowlist identifiers (table/column names) separately.
- Only allow explicitly supported, single-statement operations; reject arbitrary SQL scripts and unsafe MongoDB operators.
- Enforce user authorization and row ownership when authentication is enabled; do not rely on frontend controls for security.
- Confirm destructive actions; consider a **resettable demo database** for presentations.
- Handle API errors, network loss, empty data, slow requests, and retries gracefully.
- Use consistent query-key invalidation to synchronize Query Studio and finance views.

## 10. Recommended Frontend Structure

```text
frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── layout/           # Sidebar, Header, DashboardLayout
│   │   ├── ui/               # NeumorphicCard, Button, Input
│   │   ├── charts/           # IncomeExpense, Donut, BudgetProgress
│   │   └── database/         # QueryBuilder, QueryEditor, Results,
│   │                         # LiveDataTable, Selector, SchemaViewer,
│   │                         # ExecutionStatus
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── Income.tsx
│   │   ├── Expenses.tsx
│   │   ├── Budgets.tsx
│   │   ├── Analytics.tsx
│   │   ├── QueryStudio.tsx
│   │   ├── SQLExplorer.tsx
│   │   ├── MongoDBExplorer.tsx
│   │   ├── SchemaViewer.tsx
│   │   ├── QueryHistory.tsx
│   │   └── Settings.tsx
│   ├── hooks/               # useTransactions, useBudgets,
│   │                         # useDatabaseSchema, useQueryExecution
│   ├── services/            # api, transactions, budgets, queries
│   ├── types/               # finance, database, api
│   ├── lib/                 # utilities
│   ├── styles/globals.css
│   └── main.tsx
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 11. Responsive Behavior

- **Desktop ≥1440px:** full three-panel Query Studio.
- **Laptop 1024–1439px:** resizable or narrower panels.
- **Tablet 768–1023px:** two-panel or stacked layout.
- **Mobile <768px:** drawer navigation; builder, preview, and results stacked; sticky/easy-to-find Execute action; horizontally scrollable data tables.

## 12. Implementation Phases

1. **Inspect repository:** read README, TECH_STACK, FastAPI routes, SQLite schema, MongoDB collections; identify real vs missing APIs.
2. **Build design system:** color tokens, typography, reusable Soft UI components, responsive sidebar.
3. **Implement finance pages:** summary, transactions, budgets, charts with real API data.
4. **Implement Query Studio:** database selection, schema-aware forms, previews, execution, real results, cache invalidation.
5. **Add DBMS features:** joins, aggregates, MongoDB operations, triggers, schema viewer, history.
6. **Test and polish:** responsive/accessibility checks, network/error states, build/typecheck, integration flows.

## 13. Acceptance Tests

- [ ] User can add an expense through the finance form; it persists in SQLite and appears in the dashboard.
- [ ] User can choose SQLite → expenses → INSERT, see parameterized SQL, execute, and see the actual inserted row.
- [ ] UPDATE and DELETE reflect actual changes and require confirmation where appropriate.
- [ ] SELECT, JOIN, and aggregation return backend results for the real schema.
- [ ] MongoDB insert/find/update/delete/aggregate operate on permitted real collections.
- [ ] Query errors display real backend errors, not fake success.
- [ ] Query history and schema viewer reflect actual backend state.
- [ ] Relevant charts and totals refresh after successful mutations.
- [ ] UI works with keyboard and screen readers, including focus states.
- [ ] Layout works on desktop, tablet, and mobile.
- [ ] TypeScript checks and production build pass.

## 14. AI Coding Agent Instructions

Act as a senior frontend engineer and product designer. Implement this specification as a coherent working application, not a static mockup. **Prioritize the Live Query Studio** and light premium Neumorphism. Inspect the existing code and API before writing components; preserve working functionality. Use real data and clearly flag backend features that are missing. Do not silently introduce MySQL, SQLAlchemy, mock query execution, fabricated database records, or hardcoded dashboard totals. Run the project, test key workflows, and fix build/runtime errors.

**Desired final experience:** a polished student finance dashboard combined with a transparent, interactive **SQL + NoSQL learning laboratory** where an examiner can watch **Input → Generated Query → Execute → Persisted Data → Updated Dashboard** on a single screen.
