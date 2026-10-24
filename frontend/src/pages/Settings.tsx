import SoftCard from '../components/ui/SoftCard';
export default function Settings() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <SoftCard>
        <p>API Base URL: {import.meta.env.VITE_API_BASE_URL}</p>
        <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Configure via frontend/.env</p>
      </SoftCard>
    </div>
  );
}
