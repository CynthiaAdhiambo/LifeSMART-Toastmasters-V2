import { useState } from 'react';
import { useConfirm } from '../../components/Confirm';
import { useData } from '../../lib/data';
import { backend } from '../../lib/backend';
import { cloneMeeting, newMeeting, newSession, regularTemplate } from '../../lib/defaults';
import { fmt12, sessionSpan, shortDate, todayISO } from '../../lib/time';
import { go, href } from '../../lib/useHashRoute';
import Icon from '../../components/Icon';
import { useSaver } from '../../components/useSaver';
import type { Meeting } from '../../lib/types';

export default function MeetingsAdmin() {
  const { meetings, settings, reload } = useData();
  const { busy, msg, run } = useSaver();
  const [creating, setCreating] = useState(false);
  const [source, setSource] = useState('regular');
  const [keepPeople, setKeepPeople] = useState(false);
  const today = todayISO();
  const upcoming = meetings.filter((m) => m.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = meetings.filter((m) => m.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const create = () =>
    run(async () => {
      let m: Meeting;
      if (source === 'regular') m = newMeeting(settings, regularTemplate());
      else if (source === 'blank') m = newMeeting(settings, [newSession()]);
      else {
        const src = meetings.find((x) => x.id === source)!;
        m = cloneMeeting(src, keepPeople);
      }
      await backend.saveMeeting(m);
      await reload();
      go('/admin/meeting/' + m.id);
    }, 'Meeting created');

  const confirm = useConfirm();
  const remove = async (m: Meeting) => {
    const ok = await confirm({ title: `Delete "${m.title}"?`, body: `The ${shortDate(m.date)} agenda and its posters will be removed, along with its roles in the role tracker. This cannot be undone.`, ok: 'Delete', danger: true });
    if (!ok) return;
    run(async () => {
      for (const p of m.posters) if (p.assetId) await backend.deleteImage(p.assetId);
      await backend.deleteMeeting(m.id);
      await reload();
    }, 'Meeting deleted');
  };

  const togglePublish = (m: Meeting) =>
    run(async () => {
      await backend.saveMeeting({ ...m, published: !m.published });
      await reload();
    }, m.published ? 'Unpublished' : 'Published');

  const Card = ({ m }: { m: Meeting }) => {
    const spans = m.sessions.map(sessionSpan);
    const time = spans.length ? `${fmt12(Math.min(...spans.map((s) => s.start)))} – ${fmt12(Math.max(...spans.map((s) => s.end)))}` : '';
    return (
      <li className="card flex flex-wrap items-center gap-4 p-4">
        <div className="w-[88px] flex-none rounded-xl bg-tm-tint p-2 text-center text-tm-blue">
          <div className="font-display text-xs font-bold uppercase">{new Date(m.date + 'T12:00').toLocaleDateString('en-GB', { month: 'short' })}</div>
          <div className="font-display text-2xl font-extrabold leading-none">{m.date.slice(8)}</div>
          <div className="text-xs">{m.date.slice(0, 4)}</div>
        </div>
        <div className="min-w-[200px] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg font-bold">{m.title || 'Untitled meeting'}</span>
            <span className={`chip ${m.published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{m.published ? 'Published' : 'Draft'}</span>
          </div>
          <div className="text-sm text-tm-muted">
            {[m.theme, time, `${m.sessions.length} session${m.sessions.length === 1 ? '' : 's'}`, `${m.posters.length} poster${m.posters.length === 1 ? '' : 's'}`].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a className="btn-primary btn-sm" href={href('/admin/meeting/' + m.id)}>
            <Icon name="edit" size={16} /> Edit
          </a>
          <a className="btn-ghost btn-sm" href={href('/m/' + m.id)}>
            <Icon name="eye" size={16} /> View
          </a>
          <button type="button" className="btn-ghost btn-sm" onClick={() => togglePublish(m)} disabled={busy}>
            {m.published ? 'Unpublish' : 'Publish'}
          </button>
          <button type="button" className="btn-danger btn-sm" onClick={() => remove(m)} disabled={busy} aria-label={`Delete ${m.title}`}>
            <Icon name="trash" size={16} />
          </button>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-tm-blue">Meetings</h1>
          <p className="text-tm-muted">The public page shows the next published meeting. Past agendas are kept here; use View to open one.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setCreating((v) => !v)}>
          <Icon name="plus" size={18} /> New meeting
        </button>
      </div>

      {msg && <p className={`rounded-xl p-3 text-sm font-semibold ${msg.kind === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{msg.text}</p>}

      {creating && (
        <div className="card space-y-4 p-5">
          <h2 className="text-lg font-bold">Start from</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${source === 'regular' ? 'border-tm-blue bg-tm-tint' : 'border-tm-line'}`}>
              <input type="radio" name="src" checked={source === 'regular'} onChange={() => setSource('regular')} className="mt-1" />
              <span>
                <span className="block font-semibold">Regular meeting template</span>
                <span className="text-sm text-tm-muted">The usual running order: Toastmaster, 3 speakers, table topics, evaluations, TAG reports.</span>
              </span>
            </label>
            <label className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${source === 'blank' ? 'border-tm-blue bg-tm-tint' : 'border-tm-line'}`}>
              <input type="radio" name="src" checked={source === 'blank'} onChange={() => setSource('blank')} className="mt-1" />
              <span>
                <span className="block font-semibold">Blank</span>
                <span className="text-sm text-tm-muted">One empty session to build from scratch.</span>
              </span>
            </label>
          </div>
          {meetings.length > 0 && (
            <div className="space-y-2">
              <label className="label" htmlFor="copy">
                …or copy a previous meeting (keeps its sessions and layout, e.g. a multi-session day)
              </label>
              <select id="copy" className="input" value={source === 'regular' || source === 'blank' ? '' : source} onChange={(e) => setSource(e.target.value || 'regular')}>
                <option value="">Choose a meeting to copy…</option>
                {[...meetings]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {shortDate(m.date)} · {m.title} ({m.sessions.length} session{m.sessions.length === 1 ? '' : 's'})
                    </option>
                  ))}
              </select>
              {source !== 'regular' && source !== 'blank' && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={keepPeople} onChange={(e) => setKeepPeople(e.target.checked)} /> Keep the same people in each role
                </label>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-primary" onClick={create} disabled={busy}>
              Create draft
            </button>
            <button type="button" className="btn-ghost" onClick={() => setCreating(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Upcoming</h2>
        {upcoming.length ? <ul className="space-y-3">{upcoming.map((m) => <Card key={m.id} m={m} />)}</ul> : <p className="text-tm-muted">No upcoming meetings yet.</p>}
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Past meetings</h2>
        {past.length ? <ul className="space-y-3">{past.map((m) => <Card key={m.id} m={m} />)}</ul> : <p className="text-tm-muted">None yet.</p>}
      </section>
    </div>
  );
}
