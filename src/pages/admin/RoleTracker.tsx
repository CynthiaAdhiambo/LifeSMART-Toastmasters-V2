import { useEffect, useMemo, useState } from 'react';
import { href } from '../../lib/useHashRoute';
import { useData } from '../../lib/data';
import { backend } from '../../lib/backend';
import { buildHistory, memberStats, suggestFor, type MemberStats } from '../../lib/history';
import { ROLES, roleLabel, TRACKED } from '../../lib/roles';
import { shortDate, todayISO, uid } from '../../lib/time';
import type { RoleKey } from '../../lib/types';
import Icon from '../../components/Icon';
import { useSaver } from '../../components/useSaver';

const COLS: { key: RoleKey; short: string }[] = [
  { key: 'toastmaster', short: 'Toastmaster' },
  { key: 'evaluator', short: 'Evaluator' },
  { key: 'general_evaluator', short: 'Gen. Evaluator' },
  { key: 'table_topics_master', short: 'TT Master' },
  { key: 'timer', short: 'Timer' },
  { key: 'ah_counter', short: 'Ah Counter' },
  { key: 'grammarian', short: 'Grammarian' },
];

export default function RoleTracker() {
  const { meetings, members, settings } = useData();
  const due = settings.speechDueWeeks || 6;
  const history = useMemo(() => buildHistory(meetings, members), [meetings, members]);
  const stats = useMemo(() => memberStats(members, history, due), [members, history, due]);
  const [sort, setSort] = useState<'speech' | 'name' | 'roles'>('speech');
  const [onlyDue, setOnlyDue] = useState(false);
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const pastMeetings = meetings.filter((m) => m.date <= todayISO()).length;

  const rows = stats
    .filter((s) => (!onlyDue || s.speechDue) && s.member.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'name') return a.member.name.localeCompare(b.member.name);
      if (sort === 'roles') return a.entries.length - b.entries.length || a.member.name.localeCompare(b.member.name);
      const da = a.daysSinceSpeech ?? 1e9;
      const db = b.daysSinceSpeech ?? 1e9;
      return db - da || a.member.name.localeCompare(b.member.name);
    });

  const open = stats.find((s) => s.member.id === openId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-tm-blue">Role tracker</h1>
        <p className="text-tm-muted">
          Built from every meeting on or before today ({pastMeetings} so far) plus roles you log by hand. Use it to see who should speak or take a role next.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active members" value={stats.length} />
        <Stat label={`No speech in ${due}+ weeks`} value={stats.filter((s) => s.speechDue).length} tone="warn" />
        <Stat label="Never been Toastmaster" value={stats.filter((s) => !s.last.toastmaster).length} />
        <Stat label="Never evaluated" value={stats.filter((s) => !s.last.evaluator).length} />
      </div>

      <section className="card p-5">
        <h2 className="mb-1 text-lg font-bold">Suggestions for the next meeting</h2>
        <p className="mb-4 text-sm text-tm-muted">For each role, the members who have waited longest (or never done it).</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRACKED.map((r) => (
            <div key={r.key} className="rounded-xl border border-tm-line p-3">
              <div className="mb-2 font-display text-sm font-bold text-tm-blue">{r.label}</div>
              <ol className="space-y-1 text-sm">
                {suggestFor(r.key, stats)
                  .slice(0, 3)
                  .map(({ s, last }) => (
                    <li key={s.member.id} className="flex justify-between gap-2">
                      <button type="button" className="truncate text-left font-semibold hover:underline" onClick={() => setOpenId(s.member.id)}>
                        {s.member.name}
                      </button>
                      <span className={`flex-none ${last ? 'text-tm-muted' : 'font-semibold text-tm-maroon'}`}>{last ? shortDate(last) : 'Never'}</span>
                    </li>
                  ))}
                {!stats.length && <li className="text-tm-muted">Add members first.</li>}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-end gap-3 border-b border-tm-line p-4">
          <label className="min-w-[200px] flex-1">
            <span className="label">Search</span>
            <input className="input" placeholder="Member name" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <label>
            <span className="label">Sort by</span>
            <select className="input" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="speech">Longest since last speech</option>
              <option value="roles">Fewest roles taken</option>
              <option value="name">Name</option>
            </select>
          </label>
          <label className="flex min-h-[44px] items-center gap-2 font-semibold">
            <input type="checkbox" checked={onlyDue} onChange={(e) => setOnlyDue(e.target.checked)} className="h-5 w-5" /> Due for a speech only
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-tm-tint text-tm-blue">
              <tr>
                <th scope="col" className="px-4 py-3 font-display">Member</th>
                <th scope="col" className="px-3 py-3 font-display">Last speech</th>
                {COLS.map((c) => (
                  <th key={c.key} scope="col" className="px-3 py-3 font-display">
                    {c.short}
                  </th>
                ))}
                <th scope="col" className="px-3 py-3 font-display">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.member.id} className="border-t border-tm-line align-top hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <button type="button" className="text-left font-semibold text-tm-blue hover:underline" onClick={() => setOpenId(s.member.id)}>
                      {s.member.name}
                    </button>
                    <div className="text-xs text-tm-muted">{[s.member.path, s.member.level ? `Level ${s.member.level}` : ''].filter(Boolean).join(' · ') || '—'}</div>
                  </td>
                  <td className="px-3 py-3">
                    {s.lastSpeech ? (
                      <>
                        <div className={s.speechDue ? 'font-semibold text-tm-maroon' : ''}>{shortDate(s.lastSpeech)}</div>
                        <div className="text-xs text-tm-muted">
                          {s.speeches} speech{s.speeches === 1 ? '' : 'es'}
                          {s.lastSpeechProject ? ` · ${s.lastSpeechProject}` : ''}
                        </div>
                      </>
                    ) : (
                      <span className="chip bg-red-50 text-tm-maroon">No speech yet</span>
                    )}
                  </td>
                  {COLS.map((c) => (
                    <td key={c.key} className="px-3 py-3">
                      {s.last[c.key] ? (
                        <>
                          <div>{shortDate(s.last[c.key]!)}</div>
                          {(s.count[c.key] ?? 0) > 1 && <div className="text-xs text-tm-muted">×{s.count[c.key]}</div>}
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-3 font-semibold">{s.entries.length}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={COLS.length + 3} className="p-6 text-center text-tm-muted">
                    No members match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {open && <MemberHistory s={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'warn' }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === 'warn' && value > 0 ? 'border-tm-maroon/30 bg-red-50' : 'border-tm-line bg-white'}`}>
      <div className={`font-display text-3xl font-extrabold ${tone === 'warn' && value > 0 ? 'text-tm-maroon' : 'text-tm-blue'}`}>{value}</div>
      <div className="text-sm font-semibold text-tm-muted">{label}</div>
    </div>
  );
}

function MemberHistory({ s, onClose }: { s: MemberStats; onClose: () => void }) {
  const { reload } = useData();
  const { busy, msg, run } = useSaver();
  const [date, setDate] = useState(todayISO());
  const [role, setRole] = useState<RoleKey>('speaker');
  const [note, setNote] = useState('');
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const add = () =>
    run(async () => {
      await backend.saveMember({ ...s.member, manualRoles: [...(s.member.manualRoles || []), { id: uid(), date, role, note }] });
      setNote('');
      await reload();
    }, 'Role logged');
  const removeManual = (id: string) =>
    run(async () => {
      await backend.saveMember({ ...s.member, manualRoles: s.member.manualRoles.filter((r) => r.id !== id) });
      await reload();
    }, 'Removed');

  return (
    <div role="dialog" aria-modal="true" aria-label={`${s.member.name} role history`} className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="flex h-full w-full max-w-lg flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-tm-line p-5">
          <div>
            <h2 className="text-xl font-extrabold text-tm-blue">{s.member.name}</h2>
            <p className="text-sm text-tm-muted">
              {s.entries.length} roles · {s.speeches} speeches{s.lastSpeech ? ` · last spoke ${shortDate(s.lastSpeech)}` : ''}
            </p>
          </div>
          <button type="button" className="btn-ghost btn-sm !px-2" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {s.neverDone.length > 0 && (
            <div className="rounded-xl bg-tm-tint p-3 text-sm">
              <span className="font-semibold text-tm-blue">Not done yet: </span>
              {s.neverDone.map(roleLabel).join(', ')}
            </div>
          )}
          <div>
            <h3 className="mb-2 font-bold">History</h3>
            {s.entries.length === 0 ? (
              <p className="text-tm-muted">No roles recorded yet.</p>
            ) : (
              <ol className="space-y-2">
                {s.entries.map((e, i) => {
                  const manual = !e.meetingId ? s.member.manualRoles.find((r) => r.date === e.date && r.role === e.role && r.note === e.detail) : undefined;
                  return (
                    <li key={i} className="flex gap-3 rounded-xl border border-tm-line p-3">
                      <div className="w-[90px] flex-none text-sm font-semibold text-tm-blue">{shortDate(e.date)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">{roleLabel(e.role)}</div>
                        <div className="text-sm text-tm-muted">{[e.detail, e.meetingTitle].filter(Boolean).join(' · ')}</div>
                      </div>
                      {e.meetingId ? (
                        <a href={href('/admin/meeting/' + e.meetingId)} className="text-sm font-semibold text-tm-blue hover:underline">
                          Open
                        </a>
                      ) : (
                        manual && (
                          <button type="button" className="text-sm font-semibold text-red-700 hover:underline" onClick={() => removeManual(manual.id)} disabled={busy}>
                            Remove
                          </button>
                        )
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
          <div className="space-y-3 rounded-xl border border-tm-line p-4">
            <h3 className="font-bold">Log a past role</h3>
            <p className="text-sm text-tm-muted">For roles taken before meetings were entered in this system.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <span className="label">Date</span>
                <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label>
                <span className="label">Role</span>
                <select className="input" value={role} onChange={(e) => setRole(e.target.value as RoleKey)}>
                  {ROLES.filter((r) => r.key !== 'all').map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="label">Note</span>
              <input className="input" placeholder="e.g. Level 1 · Ice Breaker" value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            {msg && <p className={`text-sm font-semibold ${msg.kind === 'ok' ? 'text-emerald-700' : 'text-red-700'}`}>{msg.text}</p>}
            <button type="button" className="btn-primary" onClick={add} disabled={busy || !date}>
              <Icon name="plus" size={18} /> Add to history
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
