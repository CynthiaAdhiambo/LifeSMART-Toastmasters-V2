// Starting data taken from the club's existing agenda site.
// `npm run seed:sql` turns this into supabase/seed.sql.

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const MEMBERS = [
  // club members (tracked by the role tracker)
  ['Cynthia Oduor', 'member', 'Club President'],
  ['Wanjiru Thirima', 'member', 'VP Education'],
  ['Nicole Masongo', 'member', 'VP Membership'],
  ['Samson Sagwe', 'member', 'VP Public Relations (also listed as "Sammy Sagwe")'],
  ['Michael Malonza', 'member', 'Secretary'],
  ['Joanne Wanjohi', 'member', 'Treasurer'],
  ['Tiffany Mwaniki', 'member', 'Sergeant at Arms'],
  ['Mona Tanei', 'member', ''],
  ['Hildah Gichuru', 'member', ''],
  ['Aswani Ademba', 'member', ''],
  ['Emmanuel Wiseman', 'member', ''],
  ['Nicole Wanjao', 'member', ''],
  ['Michael Muli', 'member', ''],
  ['Noella Addikah', 'member', ''],
  ['Dorice Amolo', 'member', ''],
  ['Brenda Kemei', 'member', ''],
  // guests: sponsors, mentors, district leaders (not tracked)
  ['Rozy Rana', 'guest', 'Club Sponsor & Mentor'],
  ['Dolly Sagwe', 'guest', 'Club Sponsor'],
  ['Dianne Wanja', 'guest', 'Club Mentor'],
  ['Chris Otundo', 'guest', 'Mentor'],
  ['Leila Abdi', 'guest', 'Area Director'],
  ['Dan Odero', 'guest', 'Division Director'],
];

export const members = MEMBERS.map(([name, kind, notes]) => ({
  id: 'm-' + slug(name),
  name,
  kind,
  active: true,
  joinedOn: '',
  path: '',
  level: kind === 'member' ? 1 : 0,
  phone: '',
  notes,
  manualRoles: [],
}));

const byName = Object.fromEntries(members.map((m) => [m.name, m]));
const roleLabels = {
  toastmaster: 'Toastmaster of the Day', speaker: 'Speaker', evaluator: 'Speech Evaluator', general_evaluator: 'General Evaluator',
  table_topics_master: 'Table Topics Master', timer: 'Timer', ah_counter: 'Ah Counter', grammarian: 'Grammarian',
  presiding_officer: 'Presiding Officer', sergeant_at_arms: 'Sergeant at Arms', president: 'Club President', vpe: 'Vice President Education',
  officer: 'Club Officer', guest_speaker: 'Guest Speaker / Dignitary', all: 'Members', other: 'Other',
};

let n = 0;
// [title, minutes, role, person, description, labelOverride, speechProject]
const items = (prefix, rows) =>
  rows.map(([title, duration, role, person = '', description = '', label = '', speechProject = '']) => {
    const mem = byName[person];
    return {
      id: `${prefix}-${++n}`,
      title,
      description,
      duration,
      role,
      roleLabel: label || roleLabels[role],
      memberId: mem ? mem.id : null,
      personName: role === 'all' ? 'All' : person,
      speechProject,
    };
  });

const regular = {
  id: 'meeting-2026-11-14',
  date: '2026-11-14',
  title: 'Regular Meeting',
  theme: 'Under Construction',
  venue: 'Westwood Hotel',
  feeNote: 'Ksh 700 covers tea & snacks',
  word: { word: 'Reinvention', pronunciation: '/ˌriːɪnˈvɛnʃn/', partOfSpeech: 'noun', definition: 'The act of fundamentally remaking or changing something.' },
  published: true,
  posters: [],
  sessions: [
    {
      id: 's-reg-1',
      title: 'Main meeting',
      start: '08:00',
      layout: 'table',
      items: items('r', [
        ['Arrivals & Networking', 45, 'all', '', 'Arrivals and setup'],
        ['Presiding Officer calls meeting to order', 5, 'presiding_officer', 'Cynthia Oduor', 'Opens meeting, greets guests and introduces the Sergeant at Arms (SAA)'],
        ["President's opening", 5, 'president', 'Cynthia Oduor', 'Welcomes guests and introduces the Toastmaster of the Day (TMOD)', 'President'],
        ['Toastmaster introduces theme & meeting structure', 5, 'toastmaster', 'Samson Sagwe', 'TMOD introduces the theme and the meeting structure'],
        ['Toastmaster calls on meeting roles', 15, 'toastmaster', 'Samson Sagwe', 'Opening remarks and introduction of the Timer, Ah Counter & Grammarian'],
        ['Toastmaster introduces evaluators', 10, 'toastmaster', 'Samson Sagwe', 'TMOD introduces the speech evaluators'],
        ['Speaker #1', 6, 'speaker', 'Hildah Gichuru', '', '', 'Pathways Level 1 · Ice Breaker'],
        ['Speaker #2', 6, 'speaker', 'Aswani Ademba', '', '', 'Pathways Level 1 · Ice Breaker'],
        ['Speaker #3', 7, 'speaker', 'Emmanuel Wiseman', '', '', 'Pathways Level 1 · Writing a Speech with Purpose'],
        ['Toastmaster introduces Table Topics Master', 2, 'toastmaster', 'Samson Sagwe'],
        ['Table Topics', 10, 'table_topics_master', 'Tiffany Mwaniki', 'Impromptu 1–2 minute talks on a topic announced on the spot.'],
        ['Toastmaster introduces General Evaluator', 2, 'toastmaster', 'Samson Sagwe'],
        ['General Evaluator', 3, 'general_evaluator', 'Nicole Wanjao', 'Introduces the evaluators and TAG team for their reports'],
        ['Evaluator #1', 3, 'evaluator', 'Mona Tanei', 'Evaluates speaker #1 for 2–3 minutes.'],
        ['Evaluator #2', 3, 'evaluator', 'Michael Muli', 'Evaluates speaker #2 for 2–3 minutes.'],
        ['Evaluator #3', 3, 'evaluator', 'Cynthia Oduor', 'Evaluates speaker #3 for 2–3 minutes.'],
        ['Ah Counter report', 3, 'ah_counter', 'Noella Addikah', 'Counts filler words and verbal crutches to improve speaking clarity'],
        ['Timer report', 3, 'timer', 'Dorice Amolo', 'Timings for table topics, speeches and evaluations'],
        ['Grammarian report', 3, 'grammarian', 'Brenda Kemei', 'Reports on grammar and language use'],
        ['General Evaluator report', 5, 'general_evaluator', 'Nicole Wanjao'],
        ['Toastmaster closing remarks', 3, 'toastmaster', 'Samson Sagwe'],
        ['VP Education', 5, 'vpe', 'Wanjiru Thirima', 'Reviews and assigns roles for the next meeting'],
        ['Club President closing', 10, 'president', 'Cynthia Oduor', 'Updates and adjourns the meeting', 'President'],
        ['Breakfast & feedback', 30, 'all', '', 'Tea and snacks'],
      ]),
    },
  ],
};

const charter = {
  id: 'meeting-2026-10-10',
  date: '2026-10-10',
  title: 'Charter Party',
  theme: 'Focus, Frame, Perspective',
  venue: 'Westwood Hotel',
  feeNote: 'Ksh 1,500 covers tea & snacks',
  word: { word: 'Convergence', pronunciation: 'kun-VUR-jens', partOfSpeech: 'noun', definition: 'The process of coming together or meeting at a common point, especially when different people, ideas, paths, or things unite toward a shared purpose.' },
  published: true,
  posters: [],
  sessions: [
    {
      id: 's-ch-1',
      title: 'Arrivals & breakfast',
      start: '07:00',
      layout: 'timeline',
      items: items('c', [
        ['Arrivals & setup', 60, 'all'],
        ['Breakfast & networking', 45, 'all'],
      ]),
    },
    {
      id: 's-ch-2',
      title: 'Charter ceremony',
      start: '08:45',
      layout: 'timeline',
      items: items('c', [
        ['SAA calls meeting to order', 2, 'sergeant_at_arms', 'Tiffany Mwaniki', 'Opens the meeting, greets guests and introduces Dianne Wanja', 'SAA'],
        ['Opening & greeting of guests', 5, 'guest_speaker', 'Dianne Wanja', 'Welcomes guests to the charter party meeting', 'Mentor'],
        ['Speech #1', 5, 'guest_speaker', 'Dolly Sagwe', '', 'Sponsor'],
        ['Speech #2', 5, 'guest_speaker', 'Chris Otundo', '', 'Mentor'],
        ['Speech #3', 5, 'guest_speaker', 'Rozy Rana', '', 'Sponsor & Mentor'],
        ['Introduction of TMI speakers', 2, 'guest_speaker', 'Dolly Sagwe', '', 'Sponsor'],
        ['Speech #4 · Mentorship & building leaders', 5, 'guest_speaker', 'Dianne Wanja', 'The role of mentorship in building leaders', 'Mentor'],
        ['Speech #5 · The Area & LifeSMART', 5, 'guest_speaker', 'Leila Abdi', 'The role of the Area in relation to LifeSMART', 'Area Director'],
        ['Speech #6 · The Division & LifeSMART', 5, 'guest_speaker', 'Dan Odero', 'The role of the Division in relation to LifeSMART', 'Division Director'],
        ['Member induction', 15, 'guest_speaker', 'Rozy Rana', '', 'Sponsor & Mentor'],
        ['Executive Committee installation', 15, 'guest_speaker', 'Rozy Rana', '', 'Sponsor & Mentor'],
        ['Dan invites the Club President', 2, 'guest_speaker', 'Dan Odero', '', 'Division Director'],
        ['Club President acceptance speech', 3, 'president', 'Cynthia Oduor'],
        ['Invitation to present certificates', 2, 'guest_speaker', 'Leila Abdi', 'Sponsors & mentors', 'Area Director'],
        ['Award sponsor certificates', 5, 'guest_speaker', 'Dan Odero', '', 'Division Director'],
        ['Award mentor certificates', 5, 'guest_speaker', 'Dan Odero', '', 'Division Director'],
        ['Cake cutting', 8, 'guest_speaker', 'Dolly Sagwe', '', 'Sponsor'],
        ['Capturing the moment', 15, 'officer', 'Michael Malonza', 'Official photos', 'Club Secretary'],
        ['Break · networking & stretching', 20, 'all'],
      ]),
    },
    {
      id: 's-ch-3',
      title: 'Toastmasters session',
      start: '11:00',
      layout: 'timeline',
      items: items('c', [
        ['President introduces the Toastmaster', 2, 'president', 'Cynthia Oduor', 'Calls the meeting back to order for a short Toastmasters session'],
        ['Meeting structure & theme', 5, 'toastmaster', 'Wanjiru Thirima', 'Explains the flow of the meeting and why the theme was chosen', 'Toastmaster'],
        ['Toastmaster introduces TAG team', 15, 'toastmaster', 'Wanjiru Thirima', 'Theme, opening remarks and the Timer, Ah Counter & Grammarian', 'Toastmaster'],
        ['Toastmaster introduces Speaker #1', 2, 'toastmaster', 'Wanjiru Thirima', '', 'Toastmaster'],
        ['Speaker #1', 6, 'speaker', 'Mona Tanei', '', '', 'Pathways Level 1 · Ice Breaker'],
        ['Toastmaster introduces Speaker #2', 2, 'toastmaster', 'Wanjiru Thirima', '', 'Toastmaster'],
        ['Speaker #2', 7, 'speaker', 'Nicole Masongo', '', '', 'Pathways Level 1 · Writing a Speech with Purpose'],
        ['Toastmaster introduces Table Topics Master', 2, 'toastmaster', 'Wanjiru Thirima', '', 'Toastmaster'],
        ['Table Topics', 20, 'table_topics_master', 'Joanne Wanjohi', 'Impromptu 1–2 minute talks on a topic announced on the spot.', 'Table Topics Coordinator'],
        ['Toastmaster introduces General Evaluator', 2, 'toastmaster', 'Wanjiru Thirima', '', 'Toastmaster'],
        ['General Evaluator report', 5, 'general_evaluator', 'Dan Odero'],
        ['Toastmaster closing remarks', 3, 'toastmaster', 'Wanjiru Thirima', '', 'Toastmaster'],
        ['Introducing new incoming members', 10, 'president', 'Cynthia Oduor'],
        ['Club President closing', 2, 'president', 'Cynthia Oduor', 'Updates and adjourns the meeting'],
        ['Group photos', 30, 'all'],
      ]),
    },
  ],
};

export const meetings = [regular, charter];

const P = (name, role, note = '') => ({ name, role, note });
export const settings = {
  clubName: 'LifeSMART Toastmasters',
  clubNumber: '28679879',
  mission: 'We provide a supportive and positive learning experience in which members are empowered to develop communication and leadership skills, resulting in greater self-confidence and personal growth.',
  defaultVenue: 'Westwood Hotel',
  defaultFeeNote: 'Ksh 700 covers tea & snacks',
  sponsors: [P('Rozy Rana', 'Club Sponsor', 'Championing communication and leadership excellence'), P('Dolly Sagwe', 'Club Sponsor', 'Investing in the growth of our members')],
  mentors: [P('Rozy Rana', 'Club Mentor'), P('Dianne Wanja', 'Club Mentor')],
  officers: [
    P('Cynthia Oduor', 'President'),
    P('Wanjiru Thirima', 'Vice President Education'),
    P('Nicole Masongo', 'Vice President Membership'),
    P('Samson Sagwe', 'Vice President Public Relations'),
    P('Michael Malonza', 'Secretary'),
    P('Joanne Wanjohi', 'Treasurer'),
    P('Tiffany Mwaniki', 'Sergeant at Arms'),
  ],
  speechDueWeeks: 6,
  logoUrl: '',
  tmiLogoUrl: '',
};
