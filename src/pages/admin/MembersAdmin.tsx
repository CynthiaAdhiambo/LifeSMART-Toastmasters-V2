import { useMemo, useState } from 'react';
import { useConfirm } from '../../components/Confirm';
import { useData } from '../../lib/data';
import { backend } from '../../lib/backend';
import type { Member } from '../../lib/types';
import { buildHistory } from '../../lib/history';
import { shortDate, todayISO, uid } from '../../lib/time';
import Icon from '../../components/Icon';
import { useSaver } from '../../components/useSaver';

const blank = (): Member => ({ id: uid(), name: '', kind: 'member', active: true, joinedOn: todayISO(), path: '', level: 1, phone: '', notes: '', manualRoles: [] });

const PATHS = [
  'Dynamic Leadership',
  'Effective Coaching',
  'Engaging Humor',
  'Motivational Strategies',
  'Persuasive Influence',
  'Presentation Mastery',
  'Visionary Communication',
  'Leadership Development',
  'Innovative Planning',
  'Strategic Relationships',
  'Team Collaboration',
];

export default function MembersAdmin() {
  const { members, meetings, reload } = useData();
  const { busy, msg, run } = useSaver();
  const [edit, setEdit] = useState<Member | null>(null);
  const [show, setShow] = useState<'member' | 'guest' | 'inactive'>('member');
  const history = useMemo(() => buildHistory(meetings, members), [meetings, members]);
  const lastRole = (id: string) => history.find((h) => h.memberId === id)?.date;

  const list = members.filter((m) => (show === 'inactive' ? !m.active : m.active && m.kind === show));

  const save = () =>
    edit &&
    run(async () => {
      if (!edit.name.trim()) throw new Error('Please enter a name.');
      await backend.saveMember({ ...edit, name: edit.name.trim() });
      setEdit(null);
      await reload();
    }, 'Member saved');

  const confirm = useConfirm();
  const remove = async (m: Member) => {
    const used = history.some((h) => h.memberId === m.id);
    const ok = await confirm({
      title: `Delete ${m.name}?`,
      body: used ? 'They appear in past agendas, so their role history will lose its link. Marking them inactive keeps the history instead.' : undefined,
      ok: 'Delete',
      danger: true,
    });
    if (!ok) return;
    run(async () => {
      await backend.deleteMember(m.id);
      setEdit(null);
      await reload();
    }, 'Deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-tm-blue">Members</h1>
          <p className="text-tm-muted">Members appear in the role picker and the role tracker. Guests (sponsors, mentors, district leaders) can be picked for roles but aren't tracked.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setEdit(blank())}>
          <Icon name="plus" size={18} /> Add member
        </button>
      </div>
      {msg && <p className={`rounded-xl p-3 text-sm font-semibold ${msg.kind === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>{msg.text}</p>}

      <div className="flex flex-wrap gap-2" role="tablist">
        {(
          [
            ['member', 'Club members'],
            ['guest', 'Guests & dignitaries'],
            ['inactive', 'Inactive'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={show === k} onClick={() => setShow(k)} className={`btn btn-sm ${show === k ? 'bg-tm-blue text-white' : 'border border-tm-line bg-white text-tm-blue'}`}>
            {l} ({members.filter((m) => (k === 'inactive' ? !m.active : m.active && m.kind === k)).length})
          </button>
        ))}
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((m) => (
          <li key={m.id}>
            <button type="button" onClick={() => setEdit(structuredClone(m))} className="card flex w-full items-center gap-3 p-4 text-left hover:border-tm-blue">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-tm-blue font-display text-sm font-bold text-white">
                {m.name
                  .split(/\s+/)
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{m.name}</span>
                <span className="block truncate text-sm text-tm-muted">
                  {m.kind === 'member' ? [m.path, m.level ? `Level ${m.level}` : ''].filter(Boolean).join(' · ') || 'Pathways not set' : m.notes || 'Guest'}
                </span>
                <span className="block text-xs text-tm-muted">{lastRole(m.id) ? `Last role ${shortDate(lastRole(m.id)!)}` : 'No roles yet'}</span>
              </span>
            </button>
          </li>
        ))}
        {!list.length && <li className="text-tm-muted">Nobody here yet.</li>}
      </ul>

      {edit && (
        <div role="dialog" aria-modal="true" aria-label="Edit member" className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setEdit(null)}>
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-tm-blue">{members.some((x) => x.id === edit.id) ? 'Edit member' : 'New member'}</h2>
              <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => setEdit(null)} aria-label="Close">
                <Icon name="close" />
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="label">Full name</span>
                <input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} autoFocus />
              </label>
              <label>
                <span className="label">Type</span>
                <select className="input" value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value as Member['kind'] })}>
                  <option value="member">Club member (tracked)</option>
                  <option value="guest">Guest / sponsor / district (not tracked)</option>
                </select>
              </label>
              <label className="flex items-end gap-2 pb-2 font-semibold">
                <input type="checkbox" className="h-5 w-5" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Active
              </label>
              {edit.kind === 'member' && (
                <>
                  <label>
                    <span className="label">Pathways path</span>
                    <input className="input" list="paths" value={edit.path} onChange={(e) => setEdit({ ...edit, path: e.target.value })} />
                    <datalist id="paths">
                      {PATHS.map((p) => (
                        <option key={p} value={p} />
                      ))}
                    </datalist>
                  </label>
                  <label>
                    <span className="label">Current level</span>
                    <select className="input" value={edit.level} onChange={(e) => setEdit({ ...edit, level: Number(e.target.value) })}>
                      {[0, 1, 2, 3, 4, 5].map((l) => (
                        <option key={l} value={l}>
                          {l === 0 ? 'Not started' : `Level ${l}`}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="label">Joined</span>
                    <input type="date" className="input" value={edit.joinedOn} onChange={(e) => setEdit({ ...edit, joinedOn: e.target.value })} />
                  </label>
                </>
              )}
              <label>
                <span className="label">Phone (admin only)</span>
                <input className="input" type="tel" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
              </label>
              <label className="sm:col-span-2">
                <span className="label">{edit.kind === 'guest' ? 'Title / role (e.g. Area Director)' : 'Notes (admin only)'}</span>
                <textarea className="input" rows={2} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className="btn-primary" onClick={save} disabled={busy}>
                Save
              </button>
              <button type="button" className="btn-ghost" onClick={() => setEdit(null)}>
                Cancel
              </button>
              <span className="flex-1" />
              {members.some((x) => x.id === edit.id) && (
                <button type="button" className="btn-danger" onClick={() => remove(edit)} disabled={busy}>
                  <Icon name="trash" size={16} /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
