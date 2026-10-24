# Student Finance Tracker — Technology Stack

> **Status:** This document describes the **planned** stack. The backend choices follow the updated README's SQLite migration target; the frontend is a **proposed implementation** because the README does not specify an existing frontend. Listing a technology here does not mean it has already been installed or implemented.

## 1. Backend

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Language | Python 3.11+ | API, database operations, business logic |
| Web framework | FastAPI | REST API routes and automatic API documentation |
| ASGI server | Uvicorn | Run the FastAPI application |
| Data validation | Pydantic | Validate request and response payloads |
| Relational database | SQLite | Users, transactions, budgets, SQL reporting |
| Relational database access | Python built-in `sqlite3` | Parameterized SQL, CRUD, joins, transactions; **no SQLAlchemy** |
| NoSQL database | MongoDB | Activity logs and document-based analytics |
| MongoDB driver | PyMongo | MongoDB queries and aggregation pipelines |
| Demo data | Faker | Seed representative sample records |
| Testing | pytest, mongomock | Backend and MongoDB test coverage |
| Configuration | `.env` variables | Database path and MongoDB connection settings |

### Backend responsibilities

- Expose endpoints for transactions, budgets, CSV import/export, and insights.
- Store structured financial records in SQLite using direct SQL.
- Use primary/foreign keys, JOINs, aggregates, indexes, CTEs, and SQLite-compatible triggers.
- Use MongoDB aggregation pipelines for document-based insights.
- Coordinate data across SQLite and MongoDB in Python services (there is no cross-database SQL JOIN).
- Handle validation, errors, and database transactions.

### Backend configuration

```dotenv
SQLITE_DB_PATH=./data/finance_tracker.db
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=finance_tracker
```

**SQLite notes:** Python includes `sqlite3`; no pip installation is required. Enable `PRAGMA foreign_keys = ON` for every connection. SQLite does not support stored procedures. Avoid blocking the FastAPI event loop with synchronous SQLite operations in `async def` endpoints.

## 2. Frontend (proposed)

The current README describes a Python API but does not specify a frontend framework. The following is a recommended, lightweight web frontend for the project.

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Language | TypeScript | Typed frontend code |
| UI framework | React | Reusable interface components |
| Build tooling | Vite | Development server and production build |
| Styling | Tailwind CSS | Responsive dashboard layout and styling |
| Routing | React Router | Navigate between dashboard, transactions, budgets, and insights |
| Charts | Recharts | Spending trends, category breakdowns, budget visualizations |
| HTTP client | Browser `fetch` API | Call FastAPI REST endpoints; no additional HTTP library required |
| Forms and validation | React state + native HTML validation | Transaction and budget forms; add a form library only if needed |

### Proposed frontend screens

1. **Dashboard:** Income, expenses, balance, recent activity, and summary charts.
2. **Transactions:** Add, browse, filter, and import/export financial records.
3. **Budgets:** Set category limits and compare planned versus actual spending.
4. **Insights:** Visualize trends and MongoDB-powered analysis returned by the API.

The frontend should **never connect directly to SQLite or MongoDB**. All data access goes through FastAPI endpoints. Configure the frontend's API base URL through a Vite environment variable such as `VITE_API_BASE_URL=http://localhost:8000`. Configure CORS in FastAPI for the frontend origin during local development.

## 3. Architecture

```text
Browser
  |
  v
React + TypeScript + Vite
Tailwind CSS + Recharts
  |
  | HTTP / JSON (fetch)
  v
FastAPI + Pydantic (Python)
  |
  +--> Services / Business Logic
         |
         +--> sqlite3 --> SQLite (users, transactions, budgets)
         |
         +--> PyMongo --> MongoDB (logs, document insights)
```

## 4. Proposed Full-Stack Project Structure

This extends the backend-only structure from `README.md` with a **new `frontend/` folder**. It is a suggested layout, not an inventory of files already present.

```text
finance_tracker/
├── README.md
├── TECH_STACK.md
├── pyproject.toml
├── .env.example
├── .gitignore
├── seed.py
├── data/
│   └── .gitkeep
├── sql/
│   ├── schema.sql
│   ├── indexes.sql
│   └── triggers.sql
├── src/
│   └── finance_tracker/
│       ├── __init__.py
│       ├── models.py
│       ├── database.py
│       ├── crud.py
│       ├── nosql.py
│       ├── services.py
│       ├── utils.py
│       └── api/
│           ├── __init__.py
│           ├── main.py
│           ├── deps.py
│           └── routes/
│               ├── __init__.py
│               ├── transactions.py
│               ├── budgets.py
│               └── insights.py
├── tests/
│   ├── conftest.py
│   ├── test_crud.py
│   ├── test_nosql.py
│   ├── test_services.py
│   ├── test_io_utils.py
│   └── test_api.py
└── frontend/                         # Proposed React application
    ├── package.json
    ├── index.html
    ├── .env.example
    ├── vite.config.ts
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── components/
        │   ├── Layout.tsx
        │   ├── SummaryCard.tsx
        │   └── SpendingChart.tsx
        ├── pages/
        │   ├── Dashboard.tsx
        │   ├── Transactions.tsx
        │   ├── Budgets.tsx
        │   └── Insights.tsx
        ├── services/
        │   └── api.ts
        └── types/
            └── finance.ts
```

## 5. Local Development (after implementation)

**Backend** (from repository root):

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -e '.[dev]'
python seed.py
uvicorn finance_tracker.api.main:app --reload
```

Start MongoDB separately before seeding or using NoSQL features. These commands assume the backend migration is complete and the package dependencies are configured.

**Frontend** (after scaffolding the proposed Vite application):

```bash
cd frontend
npm install
npm run dev
```

Use the local Vite URL displayed in the terminal. FastAPI's interactive API documentation is available at `http://localhost:8000/docs` when the backend is running.

## 6. Final Stack Summary

**Frontend:** React + TypeScript + Vite + Tailwind CSS + React Router + Recharts + Fetch API (**proposed**).

**Backend:** Python + FastAPI + Uvicorn + Pydantic + `sqlite3` + PyMongo.

**Databases:** SQLite (relational) + MongoDB (NoSQL).

**Testing:** pytest + mongomock; frontend testing tooling to be selected when the UI is implemented.

**Excluded from the migrated design:** MySQL, PyMySQL, SQLAlchemy.
