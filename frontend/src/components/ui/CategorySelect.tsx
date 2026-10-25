import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { dbApi } from '../../services/database';
import { getCategoryIcon } from '../../lib/categoryIcons';
import { ChevronDown, Plus, Search } from 'lucide-react';

export default function CategorySelect({ type, value, onChange, placeholder = 'Select category', allowCreate = true }: {
  type: 'income' | 'expense';
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  allowCreate?: boolean;
}) {
  const qc = useQueryClient();
  const { data: cats = [] } = useQuery({ queryKey: ['categories', type], queryFn: () => dbApi.categories(type) });
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const names = cats.map((c: any) => c.name as string);
  const filtered = names.filter((n: string) => n.toLowerCase().includes(q.toLowerCase()));
  const canCreate = allowCreate && q.trim() && !names.some((n: string) => n.toLowerCase() === q.trim().toLowerCase());

  const createMut = useMutation({
    mutationFn: (name: string) => dbApi.createCategory({ name, type }),
    onSuccess: (_d, name) => {
      qc.invalidateQueries({ queryKey: ['categories', type] });
      onChange(name.trim());
      setQ('');
      setOpen(false);
    },
  });

  useEffect(() => { setHi(0); }, [q, open]);

  const select = (name: string) => {
    onChange(name);
    setQ('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') { setOpen(true); e.preventDefault(); }
      return;
    }
    const total = filtered.length + (canCreate ? 1 : 0);
    if (e.key === 'ArrowDown') { setHi(i => Math.min(total - 1, i + 1)); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { setHi(i => Math.max(0, i - 1)); e.preventDefault(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (hi < filtered.length) select(filtered[hi]);
      else if (canCreate) createMut.mutate(q.trim());
    } else if (e.key === 'Escape') { setOpen(false); setQ(''); }
  };

  const Icon = getCategoryIcon(value);

  return (
    <div className="relative">
      <button type="button" className="soft-input w-full px-3 py-2 flex items-center justify-between gap-2 text-left" onClick={() => setOpen(o => !o)}>
        <span className="flex items-center gap-2">
          {value ? <Icon size={16} /> : <Search size={16} style={{ color: 'var(--muted)' }} />}
          <span style={{ color: value ? 'var(--text)' : 'var(--muted)' }}>{value || placeholder}</span>
        </span>
        <ChevronDown size={16} style={{ color: 'var(--muted)' }} />
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-full soft-card p-2 max-h-72 overflow-auto" ref={listRef}>
          <input
            ref={inputRef}
            autoFocus
            className="soft-input w-full px-3 py-2 mb-2"
            placeholder="Search or create category..."
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={handleKey}
          />
          {filtered.map((name: string, i: number) => {
            const Ic = getCategoryIcon(name);
            return (
              <div
                key={name}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer ${i === hi ? 'soft-inset' : ''}`}
                onMouseEnter={() => setHi(i)}
                onClick={() => select(name)}
              >
                <Ic size={16} />
                <span>{name}</span>
              </div>
            );
          })}
          {canCreate && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer ${hi === filtered.length ? 'soft-inset' : ''}`}
              onMouseEnter={() => setHi(filtered.length)}
              onClick={() => createMut.mutate(q.trim())}
            >
              <Plus size={16} />
              <span>Create "{q.trim()}"</span>
            </div>
          )}
          {filtered.length === 0 && !canCreate && (
            <p className="px-3 py-2 text-sm" style={{ color: 'var(--muted)' }}>No categories found</p>
          )}
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setQ(''); }} />}
    </div>
  );
}
