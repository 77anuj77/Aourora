import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../../services/finance';
import {
  Utensils, Car, Book, Film, Zap, Home, Heart, ShoppingBag, GraduationCap, DollarSign,
  Wallet, Briefcase, Gift, TrendingUp, Tag, Plus, ChevronDown, Search,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Food: Utensils, Travel: Car, Books: Book, Entertainment: Film, Utilities: Zap,
  Rent: Home, Health: Heart, Shopping: ShoppingBag, Education: GraduationCap,
  Allowance: Wallet, Salary: DollarSign, Scholarship: GraduationCap, Freelance: Briefcase,
  Gift: Gift, Investment: TrendingUp,
};
function iconFor(name: string) {
  return ICON_MAP[name] || Tag;
}

export interface CategorySelectProps {
  value: string;
  onChange: (v: string) => void;
  type: 'income' | 'expense';
  placeholder?: string;
  allowCreate?: boolean;
  className?: string;
}

export default function CategorySelect({ value, onChange, type, placeholder = 'Select category', allowCreate = true, className = '' }: CategorySelectProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery({ queryKey: ['categories', type], queryFn: () => financeApi.categories(type) });
  const categories: string[] = data?.categories || [];

  const createMut = useMutation({
    mutationFn: (name: string) => financeApi.createCategory({ name, type }),
    onSuccess: (_d, name) => {
      qc.invalidateQueries({ queryKey: ['categories', type] });
      onChange(name);
      setOpen(false);
      setQuery('');
    },
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(c => c.toLowerCase().includes(q));
  }, [categories, query]);

  const showCreate = allowCreate && query.trim() && !categories.some(c => c.toLowerCase() === query.trim().toLowerCase());

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { if (open) { setHighlight(0); setTimeout(() => inputRef.current?.focus(), 0); } }, [open]);

  const totalOptions = filtered.length + (showCreate ? 1 : 0);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(totalOptions - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(0, h - 1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlight < filtered.length) {
        onChange(filtered[highlight]);
        setOpen(false); setQuery('');
      } else if (showCreate) {
        createMut.mutate(query.trim());
      }
    } else if (e.key === 'Escape') { setOpen(false); setQuery(''); }
  };

  const Icon = value ? iconFor(value) : Tag;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        className="soft-input w-full px-3 py-2 flex items-center justify-between gap-2 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="flex items-center gap-2">
          <Icon size={16} style={{ color: 'var(--primary)' }} />
          {value || <span style={{ color: 'var(--muted)' }}>{placeholder}</span>}
        </span>
        <ChevronDown size={16} style={{ color: 'var(--muted)' }} />
      </button>
      {open && (
        <div className="soft-card absolute z-50 mt-2 w-full p-2 max-h-72 overflow-auto">
          <div className="soft-inset flex items-center gap-2 px-2 py-1 rounded-lg mb-2">
            <Search size={14} style={{ color: 'var(--muted)' }} />
            <input
              ref={inputRef}
              className="bg-transparent outline-none flex-1 text-sm"
              placeholder="Search or create..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>
          {filtered.map((c, i) => {
            const Ic = iconFor(c);
            return (
              <button
                key={c}
                type="button"
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-left transition ${i === highlight ? 'soft-inset' : 'hover:soft-inset'}`}
                style={{ color: i === highlight ? 'var(--primary)' : 'var(--text)' }}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => { onChange(c); setOpen(false); setQuery(''); }}
              >
                <Ic size={16} />
                {c}
              </button>
            );
          })}
          {showCreate && (
            <button
              type="button"
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-left transition ${highlight === filtered.length ? 'soft-inset' : 'hover:soft-inset'}`}
              style={{ color: 'var(--primary)' }}
              onMouseEnter={() => setHighlight(filtered.length)}
              onClick={() => createMut.mutate(query.trim())}
            >
              <Plus size={16} /> Create "{query.trim()}"
            </button>
          )}
          {filtered.length === 0 && !showCreate && (
            <p className="text-xs px-2 py-2" style={{ color: 'var(--muted)' }}>No categories found</p>
          )}
        </div>
      )}
    </div>
  );
}
