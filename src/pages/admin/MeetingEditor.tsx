import { useEffect, useMemo, useState } from 'react';
import { useConfirm } from '../../components/Confirm';
import { go, href } from '../../lib/useHashRoute';
import { useData } from '../../lib/data';
import { backend } from '../../lib/backend';
import type { AgendaItem, Meeting, Member, Poster, RoleKey, Session } from '../../lib/types';
import { ROLES, roleLabel, TRACKED } from '../../lib/roles';
import { newItem, newSession } from '../../lib/defaults';
import { durLabel, fmt12, sessionSpan, shortDate, timed, uid } from '../../lib/time';
import { buildHistory, memberStats, suggestFor } from '../../lib/history';
import Icon from '../../components/Icon';
import { useSaver } from '../../components/useSaver';

const move = <T,>(arr: T[], i: number, d: number) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const a = [...arr];
  [a[i], a[j]] = [a[j], a[i]];
  return a;
};

export default function MeetingEditor({ id }: { id: string }) {
  const { meetings, members, settings, reload } = useData();
  const original = meetings.find((m) => m.id === id);
  const [m, setM] = useState<Meeting | null>(original ? structuredClone(original) : null);
  const [dirty, setDirty] = useState(false);
  const { busy, msg, run } = useSaver();
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const confirm = useConfirm();

  useEffect(() => {
    if (original && !m) setM(structuredClone(original));
  }, [original, m]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const stats = useMemo(() => memberStats(members, buildHistory(meetings.filter((x) => x.id !== id), members), settings.speechDueWeeks || 6), [members, meetings, id, settings.speechDueWeeks]);

  if (!m)
    return (
      <div className="card p-6">
        <p className="mb-3">This meeting was not found.</p>
        <a className="btn-ghost" href={href('/admin')}>
          Back to meetings
        </a>
      </div>
    );

  const update = (patch: Partial<Meeting>) => {
    setM({ ...m, ...patch });
    setDirty(true);
  };
  const setSession = (sid: string, patch: Partial<Session>) => update({ sessions: m.sessions.map((s) => (s.id === sid ? { ...s, ...patch } : s)) });
  const setItem = (sid: string, iid: string, patch: Partial<AgendaItem>) =>
    update({ sessions: m.sessions.map((s) => (s.id === sid ? { ...s, items: s.items.map((it) => (it.id === iid ? { ...it, ...patch } : it)) } : s)) });

  const assigned = new Set(m.sessions.flatMap((s) => s.items.map((i) => i.memberId).filter(Boolean) as string[]));

  const save = () =>
    run(async () => {
      // keep names on items in sync with the member list so the public page needs no member data
      const byId = new Map(members.map((x) => [x.id, x.name]));
      const out: Meeting = {
        ...m,
        sessions: m.sessions.map((s) => ({ ...s, items: s.items.map((it) => (it.memberId && byId.has(it.memberId) ? { ...it, personName: byId.get(it.memberId)! } : { ...it, personName: it.personName.trim() })) })),
      };
      await backend.saveMeeting(out);
      setDirty(false);
      await reload();
    }, 'Meeting saved');

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setUploadErr('');
    const added: Poster[] = [];
    try {
      for (const f of Array.from(files)) {
        if (!f.type.startsWith('image/')) continue;
        const r = await backend.uploadImage(f);
        added.push({ id: uid(), url: r.url, assetId: r.assetId, caption: '', sessionId: m.sessions.length === 1 ? null : null });
      }
      update({ posters: [...m.posters, ...added] });
    } catch (e) {
      setUploadErr('Upload failed: ' + (e as Error).message);
      if (added.length) update({ posters: [...m.posters, ...added] });
    } finally {
      setUploading(false);
    }
  };

  const removePoster = async (p: Poster) => {
    if (!(await confirm({ title: 'Remove this poster?', ok: 'Remove', danger: true }))) return;
    update({ posters: m.posters.filter((x) => x.id !== p.id) });
    if (p.assetId) backend.deleteImage(p.assetId).catch(() => undefined);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <a href={href('/admin')} className="text-sm font-semibold text-tm-blue hover:underline">
            ← All meetings
          </a>
          <h1 className="text-2xl font-extrabold text-tm-blue">{m.title || 'Untitled meeting'}</h1>
          <p className="text-tm-muted">{shortDate(m.date)}</p>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-tm-line bg-white px-4 py-2 font-semibold">
          <input type="checkbox" checked={m.published} onChange={(e) => update({ published: e.target.checked })} className="h-5 w-5" />
          Published (visible to everyone)
        </label>
      </div>

      {/* Details */}
      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">Meeting details</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Date">
            <input type="date" className="input" value={m.date} onChange={(e) => update({ date: e.target.value })} />
          </Field>
          <Field label="Meeting title" hint="e.g. Meeting #8, Charter Party">
            <input className="input" value={m.title} onChange={(e) => update({ title: e.target.value })} />
          </Field>
          <Field label="Theme">
            <input className="input" value={m.theme} onChange={(e) => update({ theme: e.target.value })} />
          </Field>
          <Field label="Venue">
            <input className="input" value={m.venue} onChange={(e) => update({ venue: e.target.value })} />
          </Field>
          <Field label="Fee / note" hint="e.g. Ksh 700 covers tea & snacks">
            <input className="input" value={m.feeNote} onChange={(e) => update({ feeNote: e.target.value })} />
          </Field>
        </div>
        <fieldset className="rounded-xl border border-tm-line p-4">
          <legend className="px-1 font-semibold">Word of the day</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Word">
              <input className="input" value={m.word.word} onChange={(e) => update({ word: { ...m.word, word: e.target.value } })} />
            </Field>
            <Field label="Pronunciation">
              <input className="input" value={m.word.pronunciation} onChange={(e) => update({ word: { ...m.word, pronunciation: e.target.value } })} />
            </Field>
            <Field label="Part of speech">
              <select className="input" value={m.word.partOfSpeech} onChange={(e) => update({ word: { ...m.word, partOfSpeech: e.target.value } })}>
                {['noun', 'verb', 'adjective', 'adverb', 'phrase'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Definition">
              <textarea className="input" rows={2} value={m.word.definition} onChange={(e) => update({ word: { ...m.word, definition: e.target.value } })} />
            </Field>
          </div>
        </fieldset>
      </section>

      {/* Posters */}
      <section className="card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Posters</h2>
            <p className="text-sm text-tm-muted">Add as many as you like. Link each one to a session, or to the whole day.</p>
          </div>
          <label className={`btn-primary cursor-pointer ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
            <Icon name="image" size={18} /> {uploading ? 'Uploading…' : 'Upload posters'}
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} disabled={uploading} />
          </label>
        </div>
        {uploadErr && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800">
            {uploadErr}
          </p>
        )}
        {m.posters.length === 0 ? (
          <p className="rounded-xl border border-dashed border-tm-line p-6 text-center text-tm-muted">No posters yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {m.posters.map((p, i) => (
              <li key={p.id} className="overflow-hidden rounded-xl border border-tm-line">
                <img src={p.url} alt={p.caption || 'Poster'} className="h-48 w-full bg-tm-blue object-contain" />
                <div className="space-y-2 p-3">
                  <input className="input" placeholder="Caption (optional)" value={p.caption} onChange={(e) => update({ posters: m.posters.map((x) => (x.id === p.id ? { ...x, caption: e.target.value } : x)) })} />
                  <select className="input" value={p.sessionId ?? ''} onChange={(e) => update({ posters: m.posters.map((x) => (x.id === p.id ? { ...x, sessionId: e.target.value || null } : x)) })} aria-label="Show with session">
                    <option value="">Whole day</option>
                    {m.sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-1">
                    <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => update({ posters: move(m.posters, i, -1) })} aria-label="Move earlier">
                      <Icon name="left" size={16} />
                    </button>
                    <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => update({ posters: move(m.posters, i, 1) })} aria-label="Move later">
                      <Icon name="right" size={16} />
                    </button>
                    <span className="flex-1" />
                    <button type="button" className="btn-danger btn-sm" onClick={() => removePoster(p)}>
                      <Icon name="trash" size={16} /> Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Sessions */}
      {m.sessions.map((s, si) => (
        <SessionEditor
          key={s.id}
          s={s}
          index={si}
          count={m.sessions.length}
          sessions={m.sessions}
          members={members}
          stats={stats}
          assigned={assigned}
          onSession={(patch) => setSession(s.id, patch)}
          onItem={(iid, patch) => setItem(s.id, iid, patch)}
          onMoveSession={(d) => update({ sessions: move(m.sessions, si, d) })}
          onDeleteSession={async () => {
            if (!(await confirm({ title: `Delete "${s.title}"?`, body: `Its ${s.items.length} agenda items go with it. Posters linked to it move to "Whole day".`, ok: 'Delete', danger: true }))) return;
            update({ sessions: m.sessions.filter((x) => x.id !== s.id), posters: m.posters.map((p) => (p.sessionId === s.id ? { ...p, sessionId: null } : p)) });
          }}
          onMoveItemTo={(iid, target) => {
            const it = s.items.find((x) => x.id === iid)!;
            update({
              sessions: m.sessions.map((x) => (x.id === s.id ? { ...x, items: x.items.filter((y) => y.id !== iid) } : x.id === target ? { ...x, items: [...x.items, it] } : x)),
            });
          }}
        />
      ))}
      <button
        type="button"
        className="btn-ghost w-full border-dashed"
        onClick={() => {
          const last = m.sessions[m.sessions.length - 1];
          const start = last ? fmt24(sessionSpan(last).end) : '08:45';
          update({ sessions: [...m.sessions, newSession(`Session ${m.sessions.length + 1}`, start, last?.layout ?? 'table')] });
        }}
      >
        <Icon name="plus" size={18} /> Add another session to this day
      </button>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-tm-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <span className={`text-sm font-semibold ${msg?.kind === 'err' ? 'text-red-700' : dirty ? 'text-amber-800' : 'text-emerald-700'}`} role="status">
            {msg?.text ?? (dirty ? 'Unsaved changes' : 'All changes saved')}
          </span>
          <span className="flex-1" />
          <a
            className="btn-ghost"
            href={href('/m/' + m.id)}
            onClick={async (e) => {
              if (!dirty) return;
              e.preventDefault();
              if (await confirm({ title: 'Leave without saving?', body: 'Your unsaved changes to this meeting will be lost.', ok: 'Leave', danger: true })) go('/m/' + m.id);
            }}
          >
            <Icon name="eye" size={18} /> Preview
          </a>
          <button type="button" className="btn-primary" onClick={save} disabled={busy || !dirty}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

const fmt24 = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-tm-muted">{hint}</span>}
    </label>
  );
}

function SessionEditor(props: {
  s: Session;
  index: number;
  count: number;
  sessions: Session[];
  members: Member[];
  stats: ReturnType<typeof memberStats>;
  assigned: Set<string>;
  onSession: (p: Partial<Session>) => void;
  onItem: (iid: string, p: Partial<AgendaItem>) => void;
  onMoveSession: (d: number) => void;
  onDeleteSession: () => void;
  onMoveItemTo: (iid: string, sid: string) => void;
}) {
  const { s, index, count, sessions, members, stats, assigned, onSession, onItem } = props;
  const items = timed(s);
  const sp = sessionSpan(s);
  const [open, setOpen] = useState<string | null>(null);
  const setItems = (its: AgendaItem[]) => onSession({ items: its });

  return (
    <section className="card overflow-hidden">
      <div className="space-y-4 border-b border-tm-line bg-tm-tint/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">
            Session {index + 1} <span className="font-sans text-sm font-semibold text-tm-muted">· {fmt12(sp.start)} – {fmt12(sp.end)} · {s.items.length} items</span>
          </h2>
          {count > 1 && (
            <div className="flex gap-1">
              <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => props.onMoveSession(-1)} aria-label="Move session up" disabled={index === 0}>
                <Icon name="up" size={16} />
              </button>
              <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => props.onMoveSession(1)} aria-label="Move session down" disabled={index === count - 1}>
                <Icon name="down" size={16} />
              </button>
              <button type="button" className="btn-danger btn-sm" onClick={props.onDeleteSession}>
                <Icon name="trash" size={16} /> Delete session
              </button>
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Session title">
            <input className="input" value={s.title} onChange={(e) => onSession({ title: e.target.value })} />
          </Field>
          <Field label="Starts at" hint="Item times are worked out from this and the durations.">
            <input type="time" className="input" value={s.start} onChange={(e) => onSession({ start: e.target.value })} />
          </Field>
          <Field label="Layout">
            <select className="input" value={s.layout} onChange={(e) => onSession({ layout: e.target.value as Session['layout'] })}>
              <option value="table">Table (regular meeting view)</option>
              <option value="timeline">Timeline cards (charter / special events)</option>
            </select>
          </Field>
        </div>
      </div>

      <ol className="divide-y divide-tm-line">
        {items.map((it, i) => {
          const isOpen = open === it.id;
          const tracked = TRACKED.some((r) => r.key === it.role);
          const sugg = tracked && !it.memberId ? suggestFor(it.role, stats, assigned).slice(0, 3) : [];
          return (
            <li key={it.id} className={isOpen ? 'bg-slate-50' : ''}>
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="w-[72px] flex-none font-mono text-sm font-bold text-tm-blue">{fmt12(it.startMin)}</span>
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOpen(isOpen ? null : it.id)} aria-expanded={isOpen}>
                  <span className="block truncate font-semibold">{it.title || <em className="text-tm-muted">Untitled item</em>}</span>
                  <span className="block truncate text-sm text-tm-muted">
                    {(it.personName || (it.role === 'all' ? 'All' : 'Unassigned')) + ' · ' + it.roleLabel + ' · ' + durLabel(it.duration)}
                  </span>
                </button>
                {!it.personName && it.role !== 'all' && <span className="chip hidden bg-amber-100 text-amber-900 sm:inline-flex">Needs a person</span>}
                <div className="flex flex-none gap-1">
                  <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => setItems(move(s.items, i, -1))} aria-label="Move up" disabled={i === 0}>
                    <Icon name="up" size={16} />
                  </button>
                  <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => setItems(move(s.items, i, 1))} aria-label="Move down" disabled={i === items.length - 1}>
                    <Icon name="down" size={16} />
                  </button>
                  <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => setOpen(isOpen ? null : it.id)} aria-label="Edit item">
                    <Icon name="edit" size={16} />
                  </button>
                </div>
              </div>
              {isOpen && (
                <div className="grid gap-4 px-4 pb-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="sm:col-span-2">
                    <Field label="Agenda item">
                      <input className="input" value={it.title} onChange={(e) => onItem(it.id, { title: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Duration (minutes)">
                    <input type="number" min={0} max={600} className="input" value={it.duration} onChange={(e) => onItem(it.id, { duration: Math.max(0, Number(e.target.value) || 0) })} />
                  </Field>
                  <Field label="Role">
                    <select
                      className="input"
                      value={it.role}
                      onChange={(e) => {
                        const role = e.target.value as RoleKey;
                        onItem(it.id, { role, roleLabel: role === 'all' ? 'Members' : roleLabel(role), ...(role === 'all' ? { memberId: null, personName: 'All' } : it.role === 'all' ? { personName: '' } : {}) });
                      }}
                    >
                      {['Speaking', 'Evaluation', 'Meeting roles', 'Leadership', 'Other'].map((g) => (
                        <optgroup key={g} label={g}>
                          {ROLES.filter((r) => r.group === g).map((r) => (
                            <option key={r.key} value={r.key}>
                              {r.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Description (optional)">
                      <textarea className="input" rows={2} value={it.description} onChange={(e) => onItem(it.id, { description: e.target.value })} />
                    </Field>
                  </div>
                  {it.role !== 'all' && (
                    <>
                      <div className="space-y-2">
                        <Field label="Person">
                          <select
                            className="input"
                            value={it.memberId ?? (it.personName ? '__other' : '')}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === '') onItem(it.id, { memberId: null, personName: '' });
                              else if (v === '__other') onItem(it.id, { memberId: null, personName: it.personName || '' });
                              else onItem(it.id, { memberId: v, personName: members.find((x) => x.id === v)?.name ?? '' });
                            }}
                          >
                            <option value="">— To be confirmed —</option>
                            <optgroup label="Members">
                              {members
                                .filter((x) => x.kind === 'member' && (x.active || x.id === it.memberId))
                                .map((x) => (
                                  <option key={x.id} value={x.id}>
                                    {x.name}
                                  </option>
                                ))}
                            </optgroup>
                            <optgroup label="Guests, sponsors & district">
                              {members
                                .filter((x) => x.kind === 'guest')
                                .map((x) => (
                                  <option key={x.id} value={x.id}>
                                    {x.name}
                                  </option>
                                ))}
                            </optgroup>
                            <option value="__other">Someone else (type a name)…</option>
                          </select>
                        </Field>
                        {!it.memberId && it.personName !== '' && (
                          <input className="input" placeholder="Name" value={it.personName} onChange={(e) => onItem(it.id, { personName: e.target.value })} aria-label="Name of person" />
                        )}
                        {!it.memberId && it.personName === '' && (
                          <button type="button" className="text-sm font-semibold text-tm-blue hover:underline" onClick={() => onItem(it.id, { personName: ' ' })}>
                            Type a guest's name instead
                          </button>
                        )}
                        {sugg.length > 0 && (
                          <div className="rounded-lg bg-tm-tint p-2 text-sm">
                            <span className="font-semibold text-tm-blue">Waited longest for this role:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {sugg.map(({ s: st, last }) => (
                                <button
                                  type="button"
                                  key={st.member.id}
                                  className="rounded-full border border-tm-line bg-white px-2.5 py-1 text-xs font-semibold hover:border-tm-blue"
                                  onClick={() => onItem(it.id, { memberId: st.member.id, personName: st.member.name })}
                                >
                                  {st.member.name} · {last ? shortDate(last) : 'never'}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Field label="Label under the name">
                        <input className="input" value={it.roleLabel} onChange={(e) => onItem(it.id, { roleLabel: e.target.value })} />
                      </Field>
                    </>
                  )}
                  {it.role === 'speaker' && (
                    <Field label="Pathways project" hint="e.g. Level 1 · Ice Breaker">
                      <input className="input" value={it.speechProject} onChange={(e) => onItem(it.id, { speechProject: e.target.value })} />
                    </Field>
                  )}
                  <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4">
                    {sessions.length > 1 && (
                      <select className="input w-auto" value="" onChange={(e) => e.target.value && props.onMoveItemTo(it.id, e.target.value)} aria-label="Move to session">
                        <option value="">Move to session…</option>
                        {sessions
                          .filter((x) => x.id !== s.id)
                          .map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.title}
                            </option>
                          ))}
                      </select>
                    )}
                    <button type="button" className="btn-ghost btn-sm" onClick={() => setItems([...s.items.slice(0, i + 1), { ...it, id: uid() }, ...s.items.slice(i + 1)])}>
                      <Icon name="copy" size={16} /> Duplicate
                    </button>
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      onClick={() => {
                        setItems(s.items.filter((x) => x.id !== it.id));
                        setOpen(null);
                      }}
                    >
                      <Icon name="trash" size={16} /> Delete item
                    </button>
                    <span className="flex-1" />
                    <button type="button" className="btn-primary btn-sm" onClick={() => setOpen(null)}>
                      Done
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <div className="p-4">
        <button
          type="button"
          className="btn-ghost w-full"
          onClick={() => {
            const it = newItem('New item', 5, 'other');
            setItems([...s.items, it]);
            setOpen(it.id);
          }}
        >
          <Icon name="plus" size={18} /> Add agenda item
        </button>
      </div>
    </section>
  );
}
