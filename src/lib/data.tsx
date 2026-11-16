import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { backend } from './backend';
import type { Meeting, Member, Settings } from './types';
import { emptySettings } from './defaults';

interface DataState {
  status: 'loading' | 'ready' | 'error';
  error: string;
  settings: Settings;
  meetings: Meeting[];
  members: Member[];
  isAdmin: boolean;
  reload: () => Promise<void>;
  setAdmin: (v: boolean) => void;
}

const Ctx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<DataState['status']>('loading');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<Settings>(emptySettings());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [inited, setInited] = useState(false);

  const load = useCallback(async (admin: boolean) => {
    const [s, ms, mem] = await Promise.all([
      backend.getSettings(),
      backend.listMeetings(),
      admin ? backend.listMembers() : Promise.resolve([] as Member[]),
    ]);
    setSettings({ ...emptySettings(), ...(s ?? {}) });
    setMeetings(ms);
    setMembers(mem.sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await backend.init();
        const admin = backend.isAdmin();
        await load(admin);
        if (!alive) return;
        setIsAdmin(admin);
        setInited(true);
        setStatus('ready');
      } catch (e) {
        if (!alive) return;
        setError((e as Error).message || 'Could not load the agenda.');
        setStatus('error');
      }
    })();
    return () => {
      alive = false;
    };
  }, [load]);

  const reload = useCallback(async () => {
    if (!inited) return;
    await load(backend.isAdmin());
  }, [inited, load]);

  const setAdmin = useCallback(
    (v: boolean) => {
      setIsAdmin(v);
      load(v).catch(() => undefined);
    },
    [load],
  );

  return <Ctx.Provider value={{ status, error, settings, meetings, members, isAdmin, reload, setAdmin }}>{children}</Ctx.Provider>;
}

export const useData = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useData outside provider');
  return c;
};
