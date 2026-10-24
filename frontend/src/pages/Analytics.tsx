import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../services/finance';
import SoftCard from '../components/ui/SoftCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Analytics() {
  const { data } = useQuery({ queryKey: ['dashboard', 1], queryFn: () => financeApi.dashboardSummary() });
  const inr = (n: number) => '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const colors = ['#7C83FD', '#A8B8FF', '#48BFA7', '#F5B971', '#F08080'];
  if (!data) return <div>Loading...</div>;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SoftCard>
          <h2 className="font-semibold mb-3">Spending by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={data.spending_by_category} dataKey="total_spent" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
                {data.spending_by_category.map((_: any, i: number) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => inr(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </SoftCard>
        <SoftCard>
          <h2 className="font-semibold mb-3">Budget Utilization</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.budget_vs_actual}>
              <XAxis dataKey="category" /><YAxis /><Tooltip />
              <Bar dataKey="spent" fill="#7C83FD" /><Bar dataKey="limit_amount" fill="#cbd3df" />
            </BarChart>
          </ResponsiveContainer>
        </SoftCard>
      </div>
    </div>
  );
}
