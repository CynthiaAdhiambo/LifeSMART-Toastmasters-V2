import { useEffect, useMemo, useState } from 'react';
import { useData } from '../lib/data';
import type { Meeting, Person, Poster, Settings } from '../lib/types';
import { fmt12, longDate, sessionSpan, todayISO, timed } from '../lib/time';
import { AgendaTable, AgendaTimeline } from '../components/Agenda';
import PosterGallery from '../components/PosterGallery';
import Icon from '../components/Icon';
import { ClubLogo, TmiLogo } from '../components/Logos';
import { href } from '../lib/useHashRoute';

const initials = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** Upcoming meeting nearest to today, else the most recent one. */
function pickDefault(meetings: Meeting[]) {
  const t = todayISO();
  const upcoming = meetings.filter((m) => m.date >= t).sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0] ?? [...meetings].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
}

function useNowMin(active: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, [active]);
  return active ? now.getHours() * 60 + now.getMinutes() : null;
}

function PeopleList({ title, people, tone }: { title: string; people: Person[]; tone: 'blue' | 'tint' }) {
  if (!people.length) return null;
  return (
    <section className="card p-5">
      <h2 className="mb-3 text-[17px] font-extrabold text-tm-blue">{title}</h2>
      <ul className="space-y-3">
        {people.map((p, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-[13px] font-bold ${tone === 'blue' ? 'bg-tm-blue text-white' : 'bg-tm-tint text-tm-blue'}`}>{initials(p.name)}</span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="font-semibold">{p.name}</span>
              <span className="text-sm text-tm-muted">
                {p.role}
                {p.note ? ` · ${p.note}` : ''}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function PublicMeeting({ meetingId }: { meetingId: string | null }) {
  const { meetings, settings, isAdmin } = useData();
  const published = useMemo(() => (isAdmin ? meetings : meetings.filter((m) => m.published)), [meetings, isAdmin]);
  const meeting = meetingId ? published.find((m) => m.id === meetingId) ?? null : pickDefault(published.filter((m) => m.published));
  const [tab, setTab] = useState<string>('all');
  useEffect(() => setTab('all'), [meeting?.id]);
  const isToday = meeting?.date === todayISO();
  const nowMin = useNowMin(!!isToday);

  useEffect(() => {
    document.title = meeting ? `${settings.clubName} – ${meeting.title || 'Meeting'} Agenda` : `${settings.clubName} – Meeting Agenda`;
  }, [meeting, settings.clubName]);

  if (!meeting)
    return (
      <div className="flex min-h-screen flex-col">
        <TopBar settings={settings} />
        <main className="mx-auto flex max-w-xl flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="text-2xl font-extrabold text-tm-blue">No agenda published yet</h1>
          <p className="text-tm-muted">{meetingId ? 'This agenda is not available.' : 'Check back soon for the next meeting.'}</p>
          {meetingId && (
            <a className="btn-primary" href="#">
              See the latest agenda
            </a>
          )}
        </main>
        <Footer />
      </div>
    );

  const spans = meeting.sessions.map(sessionSpan);
  const dayStart = spans.length ? Math.min(...spans.map((s) => s.start)) : 0;
  const dayEnd = spans.length ? Math.max(...spans.map((s) => s.end)) : 0;
  const visible = tab === 'all' ? meeting.sessions : meeting.sessions.filter((s) => s.id === tab);
  const multi = meeting.sessions.length > 1;
  const visibleIds = new Set(visible.map((s) => s.id));
  const posters = meeting.posters.filter((p) => !p.sessionId || visibleIds.has(p.sessionId));
  const sessionTitle = (id: string | null) => meeting.sessions.find((s) => s.id === id)?.title ?? '';
  const posterLabel = (p: Poster) => (p.sessionId ? sessionTitle(p.sessionId) : multi ? 'Whole day' : '');
  const tmods = Array.from(new Set(meeting.sessions.flatMap((s) => s.items.filter((i) => i.role === 'toastmaster' && i.personName).map((i) => i.personName))));
  const nowItem =
    nowMin === null
      ? null
      : meeting.sessions
          .flatMap((s) => timed(s))
          .find((i) => i.startMin <= nowMin && nowMin < i.endMin) ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar settings={settings} />

      {/* Hero */}
      <header className="bg-tm-blue text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 pb-10 pt-6 sm:px-6">
          {!meeting.published && <div className="w-fit rounded-full bg-tm-yellow px-3 py-1 text-sm font-bold text-tm-ink">Draft — only admins can see this</div>}
          <div className="flex flex-col gap-3">
            <span className="w-fit rounded-md bg-tm-maroon px-3 py-1.5 font-display text-xs font-bold uppercase tracking-[0.12em]">{meeting.title || 'Meeting'}</span>
            {meeting.theme && (
              <div>
                <div className="eyebrow mb-1 text-tm-yellow">Meeting theme</div>
                <h1 className="text-[clamp(28px,5vw,48px)] font-extrabold leading-[1.08]">{meeting.theme}</h1>
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Fact icon="calendar" label="Date" value={longDate(meeting.date)} />
            <Fact icon="clock" label="Time" value={spans.length ? `${fmt12(dayStart)} – ${fmt12(dayEnd)}` : '—'} sub={multi ? `${meeting.sessions.length} sessions` : undefined} />
            <Fact icon="pin" label="Location" value={meeting.venue || '—'} sub={meeting.feeNote || undefined} />
            {meeting.word.word ? (
              <div className="rounded-2xl bg-tm-yellow p-4 text-tm-ink">
                <div className="eyebrow flex items-center gap-1.5 text-[#5A4A00]">
                  <Icon name="book" size={14} /> Word of the day
                </div>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  <span className="font-display text-xl font-extrabold">{meeting.word.word}</span>
                  <span className="text-sm text-[#4A4020]">
                    {[meeting.word.pronunciation, meeting.word.partOfSpeech].filter(Boolean).join(' · ')}
                  </span>
                </div>
                {meeting.word.definition && <p className="mt-1 text-sm">{meeting.word.definition}</p>}
              </div>
            ) : (
              <div className="hidden lg:block" />
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6">
        {nowItem && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-tm-blue bg-white p-4">
            <span className="chip bg-tm-maroon text-white">On stage now</span>
            <span className="font-display font-bold">{nowItem.title}</span>
            <span className="text-tm-muted">
              {nowItem.personName || 'All members'} · until {fmt12(nowItem.endMin)}
            </span>
          </div>
        )}

        {multi && (
          <nav aria-label="Sessions" className="mb-5 flex flex-wrap gap-2">
            {[{ id: 'all', title: 'Full day' }, ...meeting.sessions].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setTab(s.id)}
                aria-pressed={tab === s.id}
                className={`btn ${tab === s.id ? 'bg-tm-blue text-white' : 'border border-tm-line bg-white text-tm-blue hover:bg-tm-tint'}`}
              >
                {s.title}
              </button>
            ))}
          </nav>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-8">
            {visible.map((s) => {
              const sp = sessionSpan(s);
              return (
                <section key={s.id} aria-labelledby={`s-${s.id}`}>
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h2 id={`s-${s.id}`} className="flex items-center gap-3 text-2xl font-extrabold">
                      <span className="h-7 w-1.5 rounded-full bg-tm-maroon" aria-hidden="true" />
                      {multi ? s.title : `${meeting.title || 'Meeting'} Agenda`}
                    </h2>
                    <span className="text-sm font-semibold text-tm-muted">
                      {fmt12(sp.start)} – {fmt12(sp.end)} · {s.items.length} items
                    </span>
                  </div>
                  {s.items.length === 0 ? (
                    <p className="card p-5 text-tm-muted">Agenda coming soon.</p>
                  ) : s.layout === 'timeline' ? (
                    <AgendaTimeline session={s} nowMin={nowMin} />
                  ) : (
                    <AgendaTable session={s} nowMin={nowMin} />
                  )}
                </section>
              );
            })}
          </div>

          <aside className="space-y-4">
            <PosterGallery posters={posters} labelFor={posterLabel} />
            <section className="card space-y-4 p-5">
              <h2 className="text-[17px] font-extrabold text-tm-blue">Meeting information</h2>
              <Info label="Meeting time" value={spans.length ? `${fmt12(dayStart)} – ${fmt12(dayEnd)}` : '—'} />
              {multi &&
                meeting.sessions.map((s) => {
                  const sp = sessionSpan(s);
                  return <Info key={s.id} label={s.title} value={`${fmt12(sp.start)} – ${fmt12(sp.end)}`} />;
                })}
              <Info label="Location" value={[meeting.venue, meeting.feeNote].filter(Boolean).join(' · ') || '—'} />
              <Info label="Toastmaster of the day" value={tmods.join(', ') || 'To be confirmed'} />
            </section>
            <PeopleList title="Club sponsors" people={settings.sponsors} tone="tint" />
            <PeopleList title="Club mentors" people={settings.mentors} tone="tint" />
            <PeopleList title="Club leadership team" people={settings.officers} tone="blue" />
            {settings.mission && (
              <section className="rounded-2xl bg-tm-blue p-5 text-white">
                <h2 className="eyebrow mb-2 text-tm-yellow">Club mission</h2>
                <p className="text-[15px] leading-relaxed">“{settings.mission}”</p>
              </section>
            )}
          </aside>
        </div>

      </main>
      <Footer />
    </div>
  );
}

function Fact({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white/[0.08] p-4">
      <Icon name={icon} className="mt-0.5 flex-none text-tm-yellow" />
      <div className="min-w-0">
        <div className="text-[13px] text-[#B9D3E6]">{label}</div>
        <div className="font-semibold">{value}</div>
        {sub && <div className="text-sm text-[#D6E4EF]">{sub}</div>}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow text-tm-muted">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function TopBar({ settings }: { settings: Settings }) {
  return (
    <div className="border-b border-white/10 bg-tm-blue text-white">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <a href="#" className="flex min-w-0 items-center gap-3">
          <ClubLogo settings={settings} className="h-10 sm:h-12" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-display text-lg font-extrabold">{settings.clubName}</span>
            {settings.clubNumber && <span className="text-sm text-[#B9D3E6]">Club #{settings.clubNumber}</span>}
          </span>
        </a>
        <TmiLogo settings={settings} className="h-11 flex-none sm:h-14" />
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-tm-line bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm text-tm-muted sm:px-6">
        <span>© {new Date().getFullYear()} LifeSMART Toastmasters</span>
        <a href={href('/admin')} className="inline-flex items-center gap-1.5 font-semibold text-tm-blue hover:underline">
          <Icon name="lock" size={16} /> Admin
        </a>
      </div>
    </footer>
  );
}
