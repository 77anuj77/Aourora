import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../services/finance';
import SoftCard from './ui/SoftCard';
import Button from './ui/Button';
import { Plus, Trash2, Edit2, Filter, Download } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import CategorySelect from './ui/CategorySelect';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  user_id: z.coerce.number().default(1),
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive(),
  category: z.string().min(1),
  description: z.string().optional(),
  date: z.string().min(1),
});

export default function TransactionManager({ fixedType }: { fixedType?: 'income' | 'expense' }) {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<any>({});
  const [editing, setEditing] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: txs = [], isLoading } = useQuery({
    queryKey: ['transactions', filters, fixedType],
    queryFn: () => financeApi.transactions({ ...filters, ...(fixedType ? { type: fixedType } : {}) }),
  });

  const createMut = useMutation({
    mutationFn: (d: any) => financeApi.createTransaction(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setShowForm(false); reset(); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, d }: any) => financeApi.updateTransaction(id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); setEditing(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: number) => financeApi.deleteTransaction(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['transactions'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { user_id: 1, type: fixedType || 'expense', amount: 0, category: '', description: '', date: new Date().toISOString().slice(0, 10) } });
  const txType = watch('type') as 'income' | 'expense';

  const onSubmit = (d: any) => {
    if (editing) updateMut.mutate({ id: editing.transaction_id, d });
    else createMut.mutate(d);
  };

  const exportCsv = async () => {
    try {
      const text = await financeApi.exportCsv({ ...filters, ...(fixedType ? { type: fixedType } : {}) });
      const blob = new Blob([text], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'transactions.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert('Export failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{fixedType ? (fixedType === 'income' ? 'Income' : 'Expenses') : 'Transactions'}</h1>
        <Button onClick={() => { setEditing(null); setShowForm(v => !v); reset({ user_id: 1, type: fixedType || 'expense', amount: 0, category: '', description: '', date: new Date().toISOString().slice(0, 10) }); }}>
          <Plus size={16} /> Add
        </Button>
        <Button variant="secondary" onClick={exportCsv}><Download size={16} /> Export CSV</Button>
      </div>

      <SoftCard>
        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={16} style={{ color: 'var(--muted)' }} />
          {!fixedType && <select className="soft-input px-2 py-1 text-sm" onChange={e => setFilters((f: any) => ({ ...f, type: e.target.value || undefined }))}>
            <option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option>
          </select>}
          <div className="w-64"><CategorySelect type={fixedType || 'expense'} value={filters.category || ''} onChange={(v) => setFilters((f: any) => ({ ...f, category: v || undefined }))} /></div>
          <input className="soft-input px-2 py-1 text-sm" type="date" onChange={e => setFilters((f: any) => ({ ...f, date_from: e.target.value || undefined }))} />
          <input className="soft-input px-2 py-1 text-sm" placeholder="Search" onChange={e => setFilters((f: any) => ({ ...f, search: e.target.value || undefined }))} />
        </div>
      </SoftCard>

      {showForm && (
        <SoftCard>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="hidden" {...register('user_id')} />
            <input type="hidden" {...register('category')} />
            {!fixedType && (
              <select className="soft-input px-3 py-2" {...register('type')}>
                <option value="income">Income</option><option value="expense">Expense</option>
              </select>
            )}
            {fixedType && <input type="hidden" value={fixedType} {...register('type')} />}
            <input className="soft-input px-3 py-2" type="number" step="0.01" placeholder="Amount" {...register('amount')} />
            <CategorySelect type={txType} value={watch('category') || ''} onChange={(v) => setValue('category', v, { shouldValidate: true })} />
            <input className="soft-input px-3 py-2" placeholder="Description" {...register('description')} />
            <input className="soft-input px-3 py-2" type="date" {...register('date')} />
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
              <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</Button>
            </div>
            {Object.keys(errors).length > 0 && <p className="text-red-500 text-sm md:col-span-3">{JSON.stringify(errors)}</p>}
          </form>
        </SoftCard>
      )}

      <SoftCard className="overflow-x-auto">
        {isLoading ? <p>Loading...</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left" style={{ color: 'var(--muted)' }}>
              <th className="py-2">Date</th><th>Type</th><th>Category</th><th>Amount</th><th>Description</th><th></th>
            </tr></thead>
            <tbody>
              {txs.map((t: any) => (
                <tr key={t.transaction_id} className="border-t" style={{ borderColor: '#cbd3df' }}>
                  <td className="py-2">{t.date}</td>
                  <td>{t.type}</td>
                  <td>{t.category}</td>
                  <td>₹{t.amount}</td>
                  <td>{t.description}</td>
                  <td className="flex gap-2">
                    <button onClick={() => { setEditing(t); setShowForm(true); }}><Edit2 size={14} /></button>
                    <button onClick={() => { if (confirm('Delete?')) deleteMut.mutate(t.transaction_id); }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </SoftCard>
    </div>
  );
}
