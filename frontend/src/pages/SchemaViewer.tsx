import { useQuery } from '@tanstack/react-query';
import { dbApi } from '../services/database';
import SoftCard from '../components/ui/SoftCard';

export default function SchemaViewer() {
  const { data } = useQuery({ queryKey: ['schema'], queryFn: () => dbApi.schema() });
  if (!data) return <div>Loading...</div>;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Schema Viewer</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SoftCard>
          <h2 className="font-semibold mb-2">SQLite Tables</h2>
          {data.sqlite.tables.map((t: any) => (
            <div key={t.table} className="mb-3">
              <p className="font-medium">{t.table}</p>
              <ul className="text-xs ml-3" style={{ color: 'var(--muted)' }}>
                {t.columns.map((c: any) => <li key={c.name}>{c.name} {c.type} {c.pk ? '(PK)' : ''} {c.notnull ? 'NOT NULL' : ''}</li>)}
              </ul>
              {t.foreign_keys?.length > 0 && <p className="text-xs mt-1">FKs: {t.foreign_keys.map((f: any) => `${f.column}->${f.ref_table}.${f.ref_column}`).join(', ')}</p>}
            </div>
          ))}
          <h3 className="font-semibold mt-3">Triggers</h3>
          {data.sqlite.triggers.map((t: any) => <pre key={t.name} className="text-xs mt-2 p-2 soft-inset rounded">{t.sql}</pre>)}
          <h3 className="font-semibold mt-3">Indexes</h3>
          <ul className="text-xs">{data.sqlite.indexes.map((i: any) => <li key={i.name}>{i.name} on {i.table}</li>)}</ul>
        </SoftCard>
        <SoftCard>
          <h2 className="font-semibold mb-2">MongoDB Collections</h2>
          {data.mongodb.collections?.map((c: any) => (
            <div key={c.collection} className="mb-3">
              <p className="font-medium">{c.collection} ({c.count})</p>
              <pre className="text-xs mt-1 p-2 soft-inset rounded">{JSON.stringify(c.sample, null, 2)}</pre>
            </div>
          ))}
        </SoftCard>
      </div>
    </div>
  );
}
