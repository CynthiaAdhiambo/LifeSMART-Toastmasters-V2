import { DataProvider, useData } from './lib/data';
import { ConfirmProvider } from './components/Confirm';
import { useHashRoute } from './lib/useHashRoute';
import PublicMeeting from './pages/PublicMeeting';
import AdminApp from './pages/admin/AdminApp';

function Routes() {
  const path = useHashRoute();
  const { status, error } = useData();

  if (status === 'loading')
    return (
      <div className="flex min-h-screen items-center justify-center p-6" role="status">
        <div className="flex flex-col items-center gap-3 text-tm-muted">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-tm-tint border-t-tm-blue" />
          Loading the agenda…
        </div>
      </div>
    );
  if (status === 'error')
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-md p-6 text-center">
          <h1 className="mb-2 text-xl font-bold text-tm-blue">Agenda unavailable</h1>
          <p className="text-tm-muted">{error}</p>
        </div>
      </div>
    );

  if (path.startsWith('/admin')) return <AdminApp path={path} />;
  const m = path.match(/^\/m\/([^/]+)/);
  return <PublicMeeting meetingId={m ? decodeURIComponent(m[1]) : null} />;
}

export default function App() {
  return (
    <DataProvider>
      <ConfirmProvider>
        <Routes />
      </ConfirmProvider>
    </DataProvider>
  );
}
