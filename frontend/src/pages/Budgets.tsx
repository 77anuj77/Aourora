import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../services/finance';
import SoftCard from '../components/ui/SoftCard';
import Button from '../components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

export default function Budgets() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ user_id: 1, category: '', limit_amount: 0, month: new Date().toISOString().slice(0, 7) });
  const { data: budgets = [] } = useQuery({ queryKey: ['budgets', 1], queryFn: () => financeApi.budgets({ user_id: 1 }) });
  const { data: vs = [] } = useQuery({ queryKey: ['budget-vs', 1], queryFn: () => financeApi.budgetVsActual() });
  const createMut = useMutation({ mutationFn: (d: any) => financeApi.createBudget(d), onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); qc.invalidateQueries({ queryKey: ['budget-vs'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => financeApi.deleteBudget(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); qc.invalidateQueries({ queryKey: ['budget-vs'] }); } });

  const inr = (n: number) => '₹' + (n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Budgets</h1>
      <SoftCard>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <input className="soft-input px-3 py-2" placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          <input className="soft-input px-3 py-2" type="number" placeholder="Limit" value={form.limit_amount} onChange={e => setForm({ ...form, limit_amount: Number(e.target.value) })} />
          <input className="soft-input px-3 py-2" type="month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} />
          <Button onClick={() => createMut.mutate(form)}><Plus size={16} /> Save</Button>
        </div>
      </SoftCard>

      <SoftCard className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr style={{ color: 'var(--muted)' }}><th className="py-2 text-left">Category</th><th>Month</th><th>Limit</th><th>Spent</th><th>Remaining</th><th>Utilization</th><th></th></tr></thead>
          <tbody>
            {vs.map((b: any) => (
              <tr key={b.category + b.month} className="border-t" style={{ borderColor: '#cbd3df' }}>
                <td className="py-2">{b.category}</td><td>{b.month}</td><td>{inr(b.limit_amount)}</td><td>{inr(b.spent)}</td><td>{inr(b.remaining)}</td><td>{b.utilization.toFixed(1)}%</td>
                <td><button onClick={() => { const found = budgets.find((x: any) => x.category === b.category && x.month === b.month); if (found) deleteMut.mutate(found.budget_id); }}><Trash2 size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SoftCard>
    </div>
  );
}
