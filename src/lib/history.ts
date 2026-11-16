import type { Meeting, Member, RoleKey } from './types';
import { TRACKED } from './roles';
import { daysBetween, todayISO } from './time';

export interface RoleEntry {
  memberId: string;
  date: string;
  meetingId: string | null;
  meetingTitle: string;
  role: RoleKey;
  roleLabel: string;
  detail: string; // item title or speech project
}

/** Every role a member has taken: agenda items from meetings on or before today, plus manually logged past roles. */
export function buildHistory(meetings: Meeting[], members: Member[], asOf = todayISO()): RoleEntry[] {
  const out: RoleEntry[] = [];
  for (const m of meetings) {
    if (m.date > asOf) continue;
    const seen = new Set<string>(); // one entry per member+role per meeting (a Toastmaster has many agenda lines)
    for (const s of m.sessions)
      for (const it of s.items) {
        if (!it.memberId) continue;
        const k = it.memberId + '|' + it.role + '|' + (it.role === 'speaker' || it.role === 'evaluator' ? it.id : '');
        if (seen.has(k)) continue;
        seen.add(k);
        out.push({
          memberId: it.memberId,
          date: m.date,
          meetingId: m.id,
          meetingTitle: m.title || m.theme,
          role: it.role,
          roleLabel: it.roleLabel,
          detail: it.role === 'speaker' && it.speechProject ? it.speechProject : it.title,
        });
      }
  }
  for (const mem of members)
    for (const r of mem.manualRoles || [])
      out.push({ memberId: mem.id, date: r.date, meetingId: null, meetingTitle: 'Logged manually', role: r.role, roleLabel: '', detail: r.note });
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export interface MemberStats {
  member: Member;
  entries: RoleEntry[];
  last: Partial<Record<RoleKey, string>>; // last date per role
  count: Partial<Record<RoleKey, number>>;
  speeches: number;
  lastSpeech: string | null;
  lastSpeechProject: string;
  lastAny: string | null;
  daysSinceSpeech: number | null;
  daysSinceAny: number | null;
  speechDue: boolean;
  neverDone: RoleKey[];
}

export function memberStats(members: Member[], history: RoleEntry[], dueWeeks: number, asOf = todayISO()): MemberStats[] {
  return members
    .filter((m) => m.kind === 'member' && m.active)
    .map((member) => {
      const entries = history.filter((h) => h.memberId === member.id);
      const last: MemberStats['last'] = {};
      const count: MemberStats['count'] = {};
      for (const e of entries) {
        if (!last[e.role] || e.date > last[e.role]!) last[e.role] = e.date;
        count[e.role] = (count[e.role] || 0) + 1;
      }
      const sp = entries.filter((e) => e.role === 'speaker');
      const lastSpeech = sp[0]?.date ?? null;
      const lastAny = entries[0]?.date ?? null;
      const daysSinceSpeech = lastSpeech ? daysBetween(lastSpeech, asOf) : null;
      return {
        member,
        entries,
        last,
        count,
        speeches: sp.length,
        lastSpeech,
        lastSpeechProject: sp[0]?.detail ?? '',
        lastAny,
        daysSinceSpeech,
        daysSinceAny: lastAny ? daysBetween(lastAny, asOf) : null,
        speechDue: daysSinceSpeech === null || daysSinceSpeech >= dueWeeks * 7,
        neverDone: TRACKED.filter((r) => !last[r.key]).map((r) => r.key),
      };
    });
}

/** For a role: members ranked by who has waited longest (never-done first, then oldest date). */
export function suggestFor(role: RoleKey, stats: MemberStats[], exclude: Set<string> = new Set()) {
  return stats
    .filter((s) => !exclude.has(s.member.id))
    .map((s) => ({ s, last: s.last[role] ?? null }))
    .sort((a, b) => {
      if (!a.last && !b.last) return (a.s.lastAny ?? '').localeCompare(b.s.lastAny ?? '');
      if (!a.last) return -1;
      if (!b.last) return 1;
      return a.last.localeCompare(b.last);
    });
}
