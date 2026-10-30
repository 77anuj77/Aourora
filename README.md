# Student Finance Tracker — FastAPI + SQLite (`sqlite3`) + MongoDB + Clerk

Full-stack student finance tracker with a React + TypeScript frontend, FastAPI backend, SQLite relational storage, MongoDB document storage, and Clerk authentication.

## Technology Stack

**Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic, `sqlite3`, PyMongo, Faker, pytest, mongomock, Clerk Backend API.

**Frontend:** React + TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Recharts, React Hook Form + Zod, Axios, Monaco Editor, Sonner, Clerk React.

**Databases:** SQLite (users, transactions, budgets, alerts, query history) and MongoDB (activity logs, financial insights).

## Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB running locally (or a MongoDB URI)
- A Clerk application (publishable + secret keys)

## Configuration
Create `.env` in the repository root:
```dotenv
SQLITE_DB_PATH=./data/finance_tracker.db
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=finance_tracker
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Installation

Backend:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
mkdir -p data
python seed.py
uvicorn finance_tracker.api.main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Tests:
```bash
pytest tests/ -v
```

Swagger UI: `http://localhost:8000/docs`

## Database Design
SQLite tables: `users` (with `clerk_user_id`), `transactions`, `budgets`, `budget_alerts`, `query_history`, plus `category_spending` view. Foreign keys, check constraints, unique constraints, indexes, and an `AFTER INSERT` trigger for budget alerts are defined in `sql/`.

MongoDB collections: `activity_logs`, `financial_insights`.

## API Endpoints
All protected endpoints require `Authorization: Bearer <Clerk session token>`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | Health check |
| GET | `/api/users/me` | Current authenticated user |
| GET | `/api/transactions` | List current user's transactions |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/{id}` | Update transaction |
| DELETE | `/api/transactions/{id}` | Delete transaction |
| POST | `/api/transactions/export` | Export CSV |
| POST | `/api/transactions/import` | Import CSV |
| GET | `/api/budgets` | List budgets |
| POST | `/api/budgets` | Create/update budget |
| GET | `/api/budgets/vs-actual` | Budget vs actual |
| GET | `/api/dashboard/summary` | Dashboard summary |
| GET | `/api/insights` | Financial insights |
| GET | `/api/database/schema` | Schema metadata |
| GET | `/api/database/tables/{table}/rows` | Table rows |
| GET | `/api/database/triggers` | Triggers |
| POST | `/api/query/sql/execute` | Execute structured SQL |
| POST | `/api/query/mongodb/execute` | Execute structured MongoDB op |
| GET | `/api/query/history` | Query history |

## Live Query Studio
The signature feature lets you select SQLite/MongoDB, a dataset, and an operation, preview the generated parameterized query, execute it through FastAPI, and inspect persisted rows and updated charts.

## Authentication
Clerk provides sign-in, sign-up, OAuth (Google/GitHub), sessions, and user profiles. Backend verifies Clerk JWTs with `clerk-backend-api` and links `clerk_user_id` to SQLite users. All data access is scoped to the authenticated user.

## Project Structure
See `TECH_STACK.md` and `FRONTEND.md` for detailed structure and design system.

## Limitations
- No roles/organizations beyond Clerk's default user.
- SQLite is single-writer; suitable for local/demo use.
- Live Query Studio executes allowlisted structured operations only (no arbitrary SQL scripts).


## Screenshots & ER Diagram

### ER Diagram
![ER Diagram](assets/FinQuery%20Student%20Finance%20ER%20Diagram.png)

### Application Screenshots
![Dashboard](assets/Screenshot%202026-10-30%20at%2012.00.33%20PM.png)
![Transactions](assets/Screenshot%202026-10-30%20at%2012.00.43%20PM.png)
![Live Query Studio](assets/Screenshot%202026-10-30%20at%2012.00.50%20PM.png)
![Schema Viewer](assets/Screenshot%202026-10-30%20at%2012.02.02%20PM.png)
