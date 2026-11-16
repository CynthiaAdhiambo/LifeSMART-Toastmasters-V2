import type { Session, AgendaItem } from './types';

export const toMin = (hhmm: string) => {
  const [h, m] = (hhmm || '00:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const fmt12 = (min: number, pad = false) => {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${pad && h12 < 10 ? '0' : ''}${h12}:${m < 10 ? '0' : ''}${m} ${ap}`;
};

export interface TimedItem extends AgendaItem {
  startMin: number;
  endMin: number;
}

/** Start times are worked out from the session start plus the durations, so they never drift. */
export const timed = (s: Session): TimedItem[] => {
  let t = toMin(s.start);
  return s.items.map((it) => {
    const startMin = t;
    t += Number(it.duration) || 0;
    return { ...it, startMin, endMin: t };
  });
};

export const sessionSpan = (s: Session) => {
  const items = timed(s);
  const start = toMin(s.start);
  const end = items.length ? items[items.length - 1].endMin : start;
  return { start, end };
};

export const durLabel = (m: number) => (m >= 60 && m % 60 === 0 ? `${m / 60} hr` : m > 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m} min`);

export const todayISO = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const longDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export const shortDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000);

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
