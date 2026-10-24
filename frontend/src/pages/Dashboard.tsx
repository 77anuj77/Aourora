import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../services/finance';
import SoftCard from '../components/ui/SoftCard';
import Button from '../components/ui/Button';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const inr = (n: number) => '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard', 1], queryFn: () => financeApi.dashboardSummary(1) });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error loading dashboard</div>;

  const d = data;
  const colors = ['#7C83FD', '#A8B8FF', '#48BFA7', '#F5B971', '#F08080'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Good day, Demo Student</h1>
          <p style={{ color: 'var(--muted)' }}>Here's your financial overview.</p>
        </div>
        <Link to="/transactions"><Button><Plus size={16} /> Add Transaction</Button></Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SoftCard><p className="text-sm" style={{ color: 'var(--muted)' }}>Total Balance</p><p className="text-2xl font-bold mt-1">{inr(d.balance)}</p></SoftCard>
        <SoftCard><p className="text-sm" style={{ color: 'var(--muted)' }}>Monthly Income</p><p className="text-2xl font-bold mt-1" style={{ color: 'var(--success)' }}>{inr(d.monthly_income)}</p></SoftCard>
        <SoftCard><p className="text-sm" style={{ color: 'var(--muted)' }}>Monthly Expenses</p><p className="text-2xl font-bold mt-1" style={{ color: 'var(--danger)' }}>{inr(d.monthly_expense)}</p></SoftCard>
        <SoftCard><p className="text-sm" style={{ color: 'var(--muted)' }}>Budget Remaining</p><p className="text-2xl font-bold mt-1">{inr(d.budget_remaining)}</p></SoftCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SoftCard>
          <h2 className="font-semibold mb-3">Spending by Category</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={d.spending_by_category} dataKey="total_spent" nameKey="category" cx="50%" cy="50%" outerRadius={90} label>
                {d.spending_by_category.map((_: any, i: number) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => inr(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </SoftCard>
        <SoftCard>
          <h2 className="font-semibold mb-3">Monthly Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={aggregateMonthly(d.monthly_trend)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(v: any) => inr(Number(v))} />
              <Bar dataKey="income" fill="#48BFA7" />
              <Bar dataKey="expense" fill="#F08080" />
            </BarChart>
          </ResponsiveContainer>
        </SoftCard>
      </div>

      <SoftCard>
        <h2 className="font-semibold mb-3">Budget Progress</h2>
        <div className="space-y-3">
          {d.budget_vs_actual.map((b: any) => {
            const pct = Math.min(100, b.utilization);
            const color = pct > 100 ? 'var(--danger)' : pct > 80 ? 'var(--warning)' : 'var(--success)';
            return (
              <div key={b.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{b.category}</span>
                  <span>{inr(b.spent)} / {inr(b.limit_amount)}</span>
                </div>
                <div className="h-3 rounded-full" style={{ background: '#cbd3df' }}>
                  <div className="h-3 rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </SoftCard>

      <SoftCard>
        <h2 className="font-semibold mb-3">Recent Activity</h2>
        <p style={{ color: 'var(--muted)' }}>See Transactions page for full list.</p>
      </SoftCard>
    </div>
  );
}

function aggregateMonthly(trend: any[]) {
  const map: Record<string, { month: string; income: number; expense: number }> = {};
  (trend || []).forEach((t: any) => {
    if (!map[t.month]) map[t.month] = { month: t.month, income: 0, expense: 0 };
    if (t.type === 'income') map[t.month].income += t.total;
    else map[t.month].expense += t.total;
  });
  return Object.values(map);
}
