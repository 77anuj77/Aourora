# Student Finance Tracker — FastAPI + SQLite (`sqlite3`) + MongoDB

A modular Python backend for college students to track income and expenses, set budgets, and receive explainable, data-driven financial insights.

> **Migration note:** This README describes the **target architecture** after replacing MySQL + SQLAlchemy with SQLite + Python's built-in `sqlite3` module. Updating this documentation does **not** migrate the application code, tests, or database automatically. Follow the migration checklist below before running the updated application.

## Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| API | FastAPI, Uvicorn | REST endpoints and validation |
| Relational database | SQLite | Users, transactions, budgets, and SQL reporting |
| SQL access | Python standard-library `sqlite3` | Direct parameterized SQL, transactions, and connection management; **no SQLAlchemy or PyMySQL** |
| NoSQL database | MongoDB, PyMongo | Activity logs and aggregation-based insights |
| Schemas | Pydantic | Request/response validation |
| Data generation | Faker | Demo data seeding |
| Testing | pytest, mongomock | SQL and NoSQL tests without a MySQL server |

## Course Outcome / Rubric Coverage

- **CO1 — Application design:** Modular FastAPI application with routers and a service layer.
- **CO2 — Python programming:** Classes, functions, exception handling, and CSV file I/O.
- **CO3 — SQL integration:** Direct `sqlite3` queries, primary/foreign keys, JOINs, GROUP BY, aggregate functions, and triggers.
- **CO4 — NoSQL integration:** MongoDB aggregation pipelines (`$match`, `$group`, `$sort`, `$lookup`).
- **CO5 — Advanced queries:** Nested queries, common table expressions (CTEs), indexing, SQLite triggers, and MongoDB pipelines. **SQLite does not support stored procedures**; use Python service functions for procedural workflows. If your rubric explicitly requires database stored procedures, SQLite alone will not meet that requirement.

## Prerequisites

- Python 3.11+
- MongoDB running locally (or a MongoDB connection URI)
- No MySQL server or separate SQLite installation required: Python includes `sqlite3`.

## Installation

From the repository root:

```bash
python -m venv .venv
source .venv/bin/activate    # macOS / Linux
python -m pip install -e ".[dev]"
```

> Update `pyproject.toml` as part of the migration: remove `sqlalchemy`, `aiomysql`/`asyncmy` (if present), and `pymysql` if no longer used; retain FastAPI, Uvicorn, PyMongo, Pydantic, Faker, pytest, and other actual project dependencies. `sqlite3` does not need to be installed with pip.

## Configuration

Create `.env` in the repository root:

```dotenv
SQLITE_DB_PATH=./data/finance_tracker.db
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=finance_tracker
```

`SQLITE_DB_PATH` is the proposed configuration variable for the migrated application. The code must be updated to read it; it is **not** a drop-in replacement for the old `MYSQL_URL` setting.

Create the database directory if needed:

```bash
mkdir -p data
```

The SQLite database file is created when the application first connects. SQL tables still need to be initialized through the project's schema setup or seed script.

## Database Design

### SQLite (relational)

The relational layer manages structured entities such as:

- **users:** user profile and identity fields
- **transactions:** income/expense records associated with a user
- **budgets:** budget limits by user and category

Relationships, constraints, and exact columns must be implemented in `schema.sql` and reflected in Pydantic request/response schemas.

Enable foreign-key enforcement **on every SQLite connection**:

```python
import sqlite3


def get_connection(db_path: str = "data/finance_tracker.db") -> sqlite3.Connection:
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection
```

Always use placeholders for values (e.g., `WHERE user_id = ?`) rather than interpolating user input into SQL strings. Commit successful writes, roll back failed transactions, and close connections reliably. For FastAPI `async def` handlers, avoid executing blocking `sqlite3` calls directly on the event loop: use synchronous `def` route handlers or run database work in a thread pool.

### MongoDB (NoSQL)

MongoDB supports document-based activity logs and aggregation-based insights. Existing aggregation concepts remain relevant; any cross-database joins must be coordinated in the service layer, since SQLite cannot directly JOIN a MongoDB collection.

## API Endpoints (target behavior)

| Method | Path | Description | Database concept |
| --- | --- | --- | --- |
| GET | `/` | Health check | API design |
| POST | `/api/v1/transactions/` | Add expense/income | SQLite INSERT, validation |
| GET | `/api/v1/transactions/?user_id=N` | List transactions | SQLite SELECT |
| GET | `/api/v1/transactions/with-user` | Transactions with user details | SQLite JOIN |
| POST | `/api/v1/transactions/export` | Export CSV | File I/O |
| POST | `/api/v1/transactions/import` | Import CSV | File I/O, batch INSERT |
| POST | `/api/v1/budgets/` | Create or update budget | SQLite UPSERT |
| GET | `/api/v1/budgets/{uid}/vs-actual` | Budget vs actual spending | LEFT JOIN, aggregation |
| GET | `/api/v1/insights/{uid}` | Financial insights | SQLite + MongoDB pipelines |
| POST | `/api/v1/insights/setup-trigger/{uid}` | **Legacy route to remove or redesign** | Trigger creation belongs in schema initialization |

The legacy `setup-trigger` endpoint was MySQL-specific. In the SQLite design, create budget-alert triggers in `schema.sql` during initialization, rather than allowing an API caller to create schema triggers dynamically. If compatibility with the old endpoint is required, explicitly redesign and document its semantics.

## Advanced Database Queries

### SQLite (`src/finance_tracker/crud.py` and `sql/`)

- **JOIN:** `get_transactions_with_user()` — transactions joined with users.
- **GROUP BY + SUM:** `spending_by_category()` — category totals.
- **CTE / nested query:** `monthly_spending_trend()` — monthly trends.
- **LEFT JOIN + aggregates:** `budget_vs_actual()` — budget utilization.
- **AFTER INSERT trigger:** budget-alert logic, defined in `sql/triggers.sql` and applied at initialization.
- **Indexes:** commonly filtered keys such as transaction user ID and date.
- **Transactions:** atomic multi-statement writes with commit/rollback.

SQLite trigger syntax differs from MySQL. Reimplement the old MySQL trigger; do not copy it unchanged. For application-specific alert delivery, a trigger may insert into an alert table, with Python services handling notifications.

### MongoDB (`src/finance_tracker/nosql.py`)

- **`$match` + `$group` + `$sort`:** `spending_insights_pipeline()` — top spending categories.
- **`$group` + `$project` + `$match`:** `anomaly_detection_pipeline()` — spending spikes.
- **`$lookup`:** `budget_utilization_pipeline()` — joins between **MongoDB collections**, not MongoDB and SQLite. If budget records live only in SQLite, compute utilization in Python instead of using `$lookup` against a nonexistent MongoDB budgets collection.

## Updated Project Structure (proposed)

```text
finance_tracker/
├── README.md                     # Project documentation
├── pyproject.toml                # Python dependencies and tool configuration
├── .env.example                  # SQLite path + MongoDB connection settings
├── .gitignore                    # Ignore .env, .venv, *.db, caches
├── seed.py                       # Initialize schema and generate demo data
├── data/
│   └── .gitkeep                  # finance_tracker.db is generated at runtime
├── sql/
│   ├── schema.sql                # CREATE TABLE + constraints
│   ├── indexes.sql               # CREATE INDEX statements
│   └── triggers.sql              # SQLite-compatible triggers
├── src/
│   └── finance_tracker/
│       ├── __init__.py
│       ├── models.py             # Pydantic schemas (no SQLAlchemy models)
│       ├── database.py           # sqlite3 connections + MongoDB client
│       ├── crud.py               # Parameterized SQLite CRUD, JOINs, CTEs
│       ├── nosql.py              # MongoDB aggregation pipelines
│       ├── services.py           # Business logic and cross-DB orchestration
│       ├── utils.py              # CSV import/export
│       └── api/
│           ├── __init__.py
│           ├── main.py           # FastAPI app assembly
│           ├── deps.py           # Dependency injection / DB lifecycle
│           └── routes/
│               ├── __init__.py
│               ├── transactions.py
│               ├── budgets.py
│               └── insights.py
└── tests/
    ├── conftest.py               # Temporary SQLite DB + mongomock fixtures
    ├── test_crud.py              # JOINs, aggregates, CTEs, triggers
    ├── test_nosql.py             # MongoDB pipelines
    ├── test_services.py          # Business rules and error handling
    ├── test_io_utils.py          # CSV import/export
    └── test_api.py               # HTTP endpoint tests
```

The tree above is the **intended post-migration structure**, not a claim that all these files currently exist.

## Running the Demo (after code migration)

```bash
# 1. Start MongoDB separately, then initialize/seed SQLite and MongoDB data
python seed.py

# 2. Start the API
uvicorn finance_tracker.api.main:app --reload

# 3. Run tests
pytest tests/ -v
```

Swagger UI: `http://localhost:8000/docs`

Demo flow: create a transaction, list transactions, compare spending with budgets, and fetch insights.

## Migration Checklist

- [ ] Replace SQLAlchemy ORM models with SQL schema definitions and keep Pydantic API schemas.
- [ ] Replace the MySQL engine/session setup with `sqlite3` connection helpers and MongoDB client setup.
- [ ] Convert ORM CRUD operations into parameterized SQLite SQL queries.
- [ ] Enable `PRAGMA foreign_keys = ON` for every connection.
- [ ] Port MySQL-specific syntax, UPSERTs, CTEs, and triggers to SQLite equivalents.
- [ ] Move trigger setup into schema initialization and remove/redesign the legacy trigger API route.
- [ ] Replace any stored-procedure calls with Python service logic; document rubric limitations.
- [ ] Confirm MongoDB `$lookup` references real MongoDB collections; move cross-DB aggregation to Python where needed.
- [ ] Update `seed.py`, environment configuration, and `pyproject.toml`.
- [ ] Update tests to use a temporary SQLite file or shared in-memory connection, plus mongomock.
- [ ] Verify all API endpoints and tests before treating the migration as complete.

## SQLite Notes

SQLite is well suited to a student project, local development, and demos. It supports foreign keys, JOINs, CTEs, views, indexes, and triggers, but not database stored procedures. It permits multiple readers but only one writer at a time, so a server database may be preferable for heavier concurrent write traffic.
