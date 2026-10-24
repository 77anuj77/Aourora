export interface User { user_id: number; name: string; email: string; }

export interface Transaction {
  transaction_id: number;
  user_id: number;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string | null;
  date: string;
}

export interface Budget {
  budget_id: number;
  user_id: number;
  category: string;
  limit_amount: number;
  month: string;
}

export interface BudgetVsActual {
  category: string;
  month: string;
  limit_amount: number;
  spent: number;
  remaining: number;
  utilization: number;
}

export interface DashboardSummary {
  user_id: number;
  total_income: number;
  total_expense: number;
  balance: number;
  budget_remaining: number;
  monthly_income: number;
  monthly_expense: number;
  spending_by_category: { category: string; total_spent: number }[];
  monthly_trend: { month: string; type: string; total: number }[];
  budget_vs_actual: BudgetVsActual[];
  alerts: any[];
}
