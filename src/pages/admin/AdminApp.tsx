import { useState, type FormEvent } from 'react';
import { href } from '../../lib/useHashRoute';
import { useData } from '../../lib/data';
import { backend } from '../../lib/backend';
import Icon from '../../components/Icon';
import { ClubLogo } from '../../components/Logos';
import MeetingsAdmin from './MeetingsAdmin';
import MeetingEditor from './MeetingEditor';
import MembersAdmin from './MembersAdmin';
import RoleTracker from './RoleTracker';
import SettingsAdmin from './SettingsAdmin';

function Login() {
  const { setAdmin, settings } = useData();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await backend.login(u, p);
      setAdmin(true);
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-tm-blue p-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <div>
          {settings.logoUrl && <div className="mb-3 w-fit rounded-xl bg-tm-blue p-2"><ClubLogo settings={settings} className="h-12" /></div>}
          <div className="eyebrow text-tm-maroon">{settings.clubName}</div>
          <h1 className="text-2xl font-extrabold text-tm-blue">Admin sign in</h1>
        </div>
        <div>
          <label className="label" htmlFor="u">Username</label>
          <input id="u" className="input" autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="p">Password</label>
          <input id="p" className="input" type="password" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} required />
        </div>
        {err && (
          <p role="alert" className="text-sm font-semibold text-red-700">
            {err}
          </p>
        )}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <a href="#" className="block text-center text-sm font-semibold text-tm-blue hover:underline">
          ← Back to the agenda
        </a>
      </form>
    </div>
  );
}

const NAV = [
  { path: '/admin', label: 'Meetings', icon: 'list' },
  { path: '/admin/roles', label: 'Role tracker', icon: 'chart' },
  { path: '/admin/members', label: 'Members', icon: 'users' },
  { path: '/admin/settings', label: 'Club settings', icon: 'settings' },
];

export default function AdminApp({ path }: { path: string }) {
  const { isAdmin, setAdmin, settings } = useData();
  if (!isAdmin) return <Login />;
  const notice = backend.adminNotice();
  const editing = path.match(/^\/admin\/meeting\/([^/]+)/);
  const active = editing ? '/admin' : NAV.find((n) => n.path === path)?.path ?? '/admin';

  let page;
  if (editing) page = <MeetingEditor id={decodeURIComponent(editing[1])} />;
  else if (path === '/admin/members') page = <MembersAdmin />;
  else if (path === '/admin/roles') page = <RoleTracker />;
  else if (path === '/admin/settings') page = <SettingsAdmin />;
  else page = <MeetingsAdmin />;

  return (
    <div className="min-h-screen">
      <header className="bg-tm-blue text-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <ClubLogo settings={settings} className="h-9" />
            <div className="leading-tight">
              <div className="font-display font-extrabold">{settings.clubName}</div>
              <div className="text-sm text-[#B9D3E6]">Admin</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="#" className="btn btn-sm text-white hover:bg-white/10">
              <Icon name="eye" size={18} /> View site
            </a>
            <button
              type="button"
              className="btn btn-sm text-white hover:bg-white/10"
              onClick={async () => {
                await backend.logout();
                setAdmin(false);
              }}
            >
              <Icon name="logout" size={18} /> Sign out
            </button>
          </div>
        </div>
        <nav aria-label="Admin" className="mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-2 sm:px-4">
          {NAV.map((n) => (
            <a
              key={n.path}
              href={href(n.path)}
              aria-current={active === n.path ? 'page' : undefined}
              className={`inline-flex min-h-[44px] flex-none items-center gap-2 rounded-t-xl px-4 font-semibold ${active === n.path ? 'bg-tm-bg text-tm-blue' : 'text-white/85 hover:bg-white/10'}`}
            >
              <Icon name={n.icon} size={18} /> {n.label}
            </a>
          ))}
        </nav>
      </header>
      {notice && (
        <div className="mx-auto mt-4 flex max-w-[1200px] gap-2 px-4 sm:px-6">
          <div className="flex w-full items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <Icon name="alert" size={18} className="mt-0.5 flex-none" /> {notice}
          </div>
        </div>
      )}
      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">{page}</main>
    </div>
  );
}
