CREATE TRIGGER IF NOT EXISTS trg_budget_alert_after_expense
AFTER INSERT ON transactions
FOR EACH ROW
WHEN NEW.type = 'expense'
BEGIN
    INSERT INTO budget_alerts (budget_id, message, created_at)
    SELECT b.budget_id,
           'Budget exceeded for category ' || b.category || ' in ' || b.month,
           datetime('now')
    FROM budgets b
    WHERE b.user_id = NEW.user_id
      AND b.category = NEW.category
      AND b.month = substr(NEW.date, 1, 7)
      AND (
            SELECT COALESCE(SUM(t.amount), 0)
            FROM transactions t
            WHERE t.user_id = NEW.user_id
              AND t.category = NEW.category
              AND t.type = 'expense'
              AND substr(t.date, 1, 7) = b.month
      ) > b.limit_amount;
END;
