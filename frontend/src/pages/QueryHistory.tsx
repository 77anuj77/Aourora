import { useQuery } from '@tanstack/react-query';
import { dbApi } from '../services/database';
import SoftCard from '../components/ui/SoftCard';

export default function QueryHistory() {
  const { data = [] } = useQuery({ queryKey: ['history'], queryFn: () => dbApi.history(100) });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Query History</h1>
      <SoftCard className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr style={{ color: 'var(--muted)' }}><th className="py-2 text-left">ID</th><th>DB</th><th>Op</th><th>Status</th><th>Affected</th><th>Duration</th><th>Created</th></tr></thead>
          <tbody>
            {data.map((h: any) => (
              <tr key={h.history_id} className="border-t" style={{ borderColor: '#cbd3df' }}>
                <td className="py-2">{h.history_id}</td><td>{h.database_name}</td><td>{h.operation}</td><td>{h.status}</td><td>{h.affected_rows}</td><td>{h.duration_ms}</td><td>{h.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SoftCard>
    </div>
  );
}
