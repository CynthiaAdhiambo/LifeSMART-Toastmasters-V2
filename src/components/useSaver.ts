import { useState } from 'react';

/** Small helper: run an async save and expose busy / message state for the UI. */
export function useSaver() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const run = async (fn: () => Promise<void>, ok = 'Saved') => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ kind: 'ok', text: ok });
      setTimeout(() => setMsg((m) => (m?.kind === 'ok' ? null : m)), 2500);
      return true;
    } catch (e) {
      setMsg({ kind: 'err', text: (e as Error).message || 'Something went wrong' });
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, msg, run, setMsg };
}
