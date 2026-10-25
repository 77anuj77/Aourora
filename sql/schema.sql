PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    clerk_user_id TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    amount REAL NOT NULL CHECK (amount > 0),
    category TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS budgets (
    budget_id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    limit_amount REAL NOT NULL CHECK (limit_amount >= 0),
    month TEXT NOT NULL,
    UNIQUE (user_id, category, month),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS budget_alerts (
    alert_id INTEGER PRIMARY KEY,
    budget_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (budget_id) REFERENCES budgets(budget_id)
);

CREATE TABLE IF NOT EXISTS query_history (
    history_id INTEGER PRIMARY KEY,
    database_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    preview TEXT,
    parameters TEXT,
    status TEXT NOT NULL,
    affected_rows INTEGER,
    duration_ms REAL,
    created_at TEXT NOT NULL
);

CREATE VIEW IF NOT EXISTS category_spending AS
SELECT user_id, category, SUM(amount) AS total_spent
FROM transactions
WHERE type = 'expense'
GROUP BY user_id, category;


CREATE TABLE IF NOT EXISTS categories (
    category_id INTEGER PRIMARY KEY,
    user_id INTEGER,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income','expense')),
    UNIQUE (user_id, name, type),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
