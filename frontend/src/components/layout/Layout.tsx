import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Receipt, TrendingUp, TrendingDown, Wallet, BarChart3, Database, Table2, History, Settings, Search } from 'lucide-react';

const nav = [
  { label: 'Finance', items: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: Receipt },
    { to: '/income', label: 'Income', icon: TrendingUp },
    { to: '/expenses', label: 'Expenses', icon: TrendingDown },
    { to: '/budgets', label: 'Budgets', icon: Wallet },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ]},
  { label: 'Database Lab', items: [
    { to: '/query-studio', label: 'Live Query Studio', icon: Database },
    { to: '/schema', label: 'Schema Viewer', icon: Table2 },
    { to: '/history', label: 'Query History', icon: History },
  ]},
  { label: 'System', items: [
    { to: '/settings', label: 'Settings', icon: Settings },
  ]},
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex">
      {/* sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-[250px] p-4 transform transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="soft-card h-full flex flex-col p-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-bold" style={{ color: 'var(--primary)' }}>Finance Tracker</h1>
            <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18}/></button>
          </div>
          <nav className="flex-1 overflow-y-auto space-y-4" aria-label="Primary">
            {nav.map(section => (
              <div key={section.label}>
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>{section.label}</p>
                <ul className="space-y-1">
                  {section.items.map(item => (
                    <li key={item.to}>
                      <NavLink to={item.to} end={item.to === '/'} onClick={() => setOpen(false)}
                        className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ${isActive ? 'soft-inset font-semibold' : 'hover:soft-inset'}`}
                        style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--text)' })}>
                        <item.icon size={16} />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>
      {open && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3">
          <button className="lg:hidden soft-btn p-2" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={18}/></button>
          <div className="soft-inset flex items-center gap-2 px-3 py-2 rounded-xl flex-1 max-w-md">
            <Search size={16} style={{ color: 'var(--muted)' }} />
            <input className="bg-transparent outline-none flex-1 text-sm" placeholder="Search..." />
          </div>
          <div className="soft-card px-3 py-2 text-sm">Demo Student</div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
