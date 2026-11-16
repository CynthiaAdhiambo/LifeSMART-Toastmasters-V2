import type { AgendaItem, Meeting, RoleKey, Session, Settings } from './types';
import { roleLabel } from './roles';
import { todayISO, uid } from './time';

export const emptySettings = (): Settings => ({
  clubName: 'LifeSMART Toastmasters',
  clubNumber: '',
  mission: '',
  defaultVenue: '',
  defaultFeeNote: '',
  sponsors: [],
  mentors: [],
  officers: [],
  speechDueWeeks: 6,
  logoUrl: '',
  tmiLogoUrl: '',
});

export const newItem = (title = '', duration = 5, role: RoleKey = 'other', description = ''): AgendaItem => ({
  id: uid(),
  title,
  description,
  duration,
  role,
  roleLabel: role === 'all' ? 'Members' : roleLabel(role),
  memberId: null,
  personName: role === 'all' ? 'All' : '',
  speechProject: '',
});

export const newSession = (title = 'Main session', start = '08:45', layout: Session['layout'] = 'table'): Session => ({
  id: uid(),
  title,
  start,
  layout,
  items: [],
});

/** The club's regular meeting running order (the "updated view" on the old site). */
export function regularTemplate(): Session[] {
  const s = newSession('Main meeting', '08:00', 'table');
  const I = newItem;
  s.items = [
    I('Arrivals & Networking', 45, 'all', 'Arrivals and setup'),
    I('Presiding Officer calls meeting to order', 5, 'presiding_officer', 'Opens meeting, greets guests and introduces the Sergeant at Arms (SAA)'),
    I("President's opening", 5, 'president', 'Welcomes guests and introduces the Toastmaster of the Day (TMOD)'),
    I('Toastmaster introduces theme & meeting structure', 5, 'toastmaster', 'TMOD introduces the theme and the meeting structure'),
    I('Toastmaster calls on meeting roles', 15, 'toastmaster', 'Opening remarks and introduction of the Timer, Ah Counter & Grammarian'),
    I('Toastmaster introduces evaluators', 10, 'toastmaster', 'TMOD introduces the speech evaluators'),
    I('Speaker #1', 7, 'speaker'),
    I('Speaker #2', 7, 'speaker'),
    I('Speaker #3', 7, 'speaker'),
    I('Toastmaster introduces Table Topics Master', 2, 'toastmaster'),
    I('Table Topics', 10, 'table_topics_master', 'Impromptu 1–2 minute talks on a topic announced on the spot.'),
    I('Toastmaster introduces General Evaluator', 2, 'toastmaster'),
    I('General Evaluator', 3, 'general_evaluator', 'Introduces the evaluators and TAG team for their reports'),
    I('Evaluator #1', 3, 'evaluator', 'Evaluates speaker #1 for 2–3 minutes.'),
    I('Evaluator #2', 3, 'evaluator', 'Evaluates speaker #2 for 2–3 minutes.'),
    I('Evaluator #3', 3, 'evaluator', 'Evaluates speaker #3 for 2–3 minutes.'),
    I('Ah Counter report', 3, 'ah_counter', 'Counts filler words and verbal crutches to improve speaking clarity'),
    I('Timer report', 3, 'timer', 'Timings for table topics, speeches and evaluations'),
    I('Grammarian report', 3, 'grammarian', 'Reports on grammar and language use'),
    I('General Evaluator report', 5, 'general_evaluator'),
    I('Toastmaster closing remarks', 3, 'toastmaster'),
    I('VP Education', 5, 'vpe', 'Reviews and assigns roles for the next meeting'),
    I('Club President closing', 10, 'president', 'Updates and adjourns the meeting'),
    I('Breakfast & feedback', 30, 'all', 'Tea and snacks'),
  ];
  return [s];
}

export function newMeeting(settings: Settings | null, sessions: Session[] = regularTemplate()): Meeting {
  return {
    id: uid(),
    date: todayISO(),
    title: 'Club meeting',
    theme: '',
    venue: settings?.defaultVenue ?? '',
    feeNote: settings?.defaultFeeNote ?? '',
    word: { word: '', pronunciation: '', partOfSpeech: 'noun', definition: '' },
    published: false,
    sessions,
    posters: [],
  };
}

/** Deep copy with fresh ids (for "duplicate"); names are cleared so roles can be reassigned. */
export function cloneMeeting(m: Meeting, keepPeople: boolean): Meeting {
  const idMap = new Map<string, string>();
  const sessions = m.sessions.map((s) => {
    const nid = uid();
    idMap.set(s.id, nid);
    return {
      ...s,
      id: nid,
      items: s.items.map((it) => ({
        ...it,
        id: uid(),
        memberId: keepPeople ? it.memberId : null,
        personName: keepPeople || it.role === 'all' ? it.personName : '',
        speechProject: keepPeople ? it.speechProject : '',
      })),
    };
  });
  return {
    ...m,
    id: uid(),
    date: todayISO(),
    title: m.title + ' (copy)',
    published: false,
    sessions,
    posters: [],
  };
}
