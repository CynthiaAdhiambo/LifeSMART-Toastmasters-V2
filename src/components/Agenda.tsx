import type { Session } from '../lib/types';
import { durLabel, fmt12, timed, type TimedItem } from '../lib/time';
import Icon from './Icon';

const initials = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const who = (it: TimedItem) => it.personName || (it.role === 'all' ? 'All' : 'To be confirmed');

function Person({ it, compact = false }: { it: TimedItem; compact?: boolean }) {
  const name = who(it);
  if (it.role === 'all')
    return (
      <span className="inline-flex items-center gap-2 text-tm-muted">
        <Icon name="users" size={18} />
        <span>
          <span className="font-semibold text-tm-ink">All</span> <span className="text-sm">· Members</span>
        </span>
      </span>
    );
  const tbc = !it.personName;
  return (
    <span className="inline-flex items-center gap-2.5">
      {!compact && (
        <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-full font-display text-xs font-bold ${tbc ? 'border border-dashed border-tm-line text-tm-muted' : 'bg-tm-blue text-white'}`}>
          {tbc ? '?' : initials(name)}
        </span>
      )}
      <span className="flex flex-col leading-tight">
        <span className={`font-semibold ${tbc ? 'italic text-tm-muted' : ''}`}>{name}</span>
        <span className="text-sm text-tm-muted">{it.roleLabel}</span>
      </span>
    </span>
  );
}

export function AgendaTable({ session, nowMin }: { session: Session; nowMin: number | null }) {
  const items = timed(session);
  const isNow = (it: TimedItem) => nowMin !== null && it.startMin <= nowMin && nowMin < it.endMin;
  return (
    <div className="overflow-hidden rounded-2xl border border-tm-line bg-white">
      {/* Desktop / tablet: table */}
      <table className="hidden w-full border-collapse text-left md:table">
        <thead className="bg-tm-blue text-white">
          <tr>
            <th scope="col" className="w-[120px] px-5 py-3.5 font-display text-sm font-bold">Time</th>
            <th scope="col" className="px-5 py-3.5 font-display text-sm font-bold">Agenda item</th>
            <th scope="col" className="w-[30%] px-5 py-3.5 font-display text-sm font-bold">Member / Role</th>
            <th scope="col" className="w-[110px] px-5 py-3.5 text-right font-display text-sm font-bold">Duration</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.id} className={`border-t border-tm-line align-top ${isNow(it) ? 'bg-tm-yellow/40' : i % 2 ? 'bg-slate-50/70' : ''}`}>
              <td className="px-5 py-4 font-mono text-[15px] font-bold text-tm-blue">
                {fmt12(it.startMin, true)}
                {isNow(it) && <span className="chip mt-1 block w-fit bg-tm-maroon text-white">Now</span>}
              </td>
              <td className="px-5 py-4">
                <div className="font-semibold">{it.title}</div>
                {it.role === 'speaker' && it.speechProject && <div className="text-[15px] font-semibold text-tm-maroon">{it.speechProject}</div>}
                {it.description && <div className="text-[15px] text-tm-muted">{it.description}</div>}
              </td>
              <td className="px-5 py-4">
                <Person it={it} compact />
              </td>
              <td className="px-5 py-4 text-right">
                <span className="chip whitespace-nowrap bg-tm-tint text-tm-blue">{durLabel(it.duration)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Phone: stacked rows */}
      <ol className="divide-y divide-tm-line md:hidden">
        {items.map((it) => (
          <li key={it.id} className={`flex gap-3 px-4 py-3.5 ${isNow(it) ? 'bg-tm-yellow/40' : ''}`}>
            <div className="w-[68px] flex-none">
              <div className="font-mono text-sm font-bold text-tm-blue">{fmt12(it.startMin)}</div>
              <div className="text-xs text-tm-muted">{durLabel(it.duration)}</div>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold leading-snug">{it.title}</span>
                {isNow(it) && <span className="chip bg-tm-maroon text-white">Now</span>}
              </div>
              {it.role === 'speaker' && it.speechProject && <div className="text-sm font-semibold text-tm-maroon">{it.speechProject}</div>}
              {it.description && <div className="text-sm text-tm-muted">{it.description}</div>}
              <Person it={it} compact />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function AgendaTimeline({ session, nowMin }: { session: Session; nowMin: number | null }) {
  const items = timed(session);
  return (
    <ol className="space-y-2.5">
      {items.map((it) => {
        const now = nowMin !== null && it.startMin <= nowMin && nowMin < it.endMin;
        return (
          <li
            key={it.id}
            className={`flex gap-4 rounded-2xl border p-4 ${now ? 'border-2 border-tm-blue bg-white shadow-md' : it.role === 'all' ? 'border-tm-line bg-[#EEF1F4]' : 'border-tm-line bg-white'}`}
          >
            <div className="w-[76px] flex-none">
              <div className="font-display text-[15px] font-bold text-tm-blue">{fmt12(it.startMin)}</div>
              <div className="text-sm text-tm-muted">{durLabel(it.duration)}</div>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-sans text-[17px] font-bold leading-snug">{it.title}</h4>
                {now && <span className="chip bg-tm-maroon text-white">Now</span>}
              </div>
              {it.role === 'speaker' && it.speechProject && <p className="text-[15px] font-semibold text-tm-maroon">{it.speechProject}</p>}
              {it.description && <p className="text-[15px] text-tm-muted">{it.description}</p>}
              <Person it={it} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
