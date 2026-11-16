export type RoleKey =
  | 'toastmaster'
  | 'speaker'
  | 'evaluator'
  | 'general_evaluator'
  | 'table_topics_master'
  | 'table_topics_speaker'
  | 'timer'
  | 'ah_counter'
  | 'grammarian'
  | 'presiding_officer'
  | 'sergeant_at_arms'
  | 'president'
  | 'vpe'
  | 'officer'
  | 'guest_speaker'
  | 'all'
  | 'other';

export type Layout = 'table' | 'timeline';

export interface AgendaItem {
  id: string;
  title: string;
  description: string;
  duration: number; // minutes
  role: RoleKey;
  roleLabel: string; // shown under the name, e.g. "Toastmaster of the Day"
  memberId: string | null; // linked member (counts toward role history)
  personName: string; // free-text name when no member is linked (guests, "All members")
  speechProject: string; // e.g. "Level 1 · Ice Breaker" (speakers only)
}

export interface Session {
  id: string;
  title: string;
  start: string; // "HH:MM" 24h
  layout: Layout;
  items: AgendaItem[];
}

export interface Poster {
  id: string;
  url: string;
  assetId?: string; // storage key, used to delete the file
  caption: string;
  sessionId: string | null; // null = whole day
}

export interface WordOfDay {
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  definition: string;
}

export interface Meeting {
  id: string;
  date: string; // YYYY-MM-DD
  title: string; // e.g. "Charter Party" or "Meeting #8"
  theme: string;
  venue: string;
  feeNote: string;
  word: WordOfDay;
  published: boolean;
  sessions: Session[];
  posters: Poster[];
  updatedAt?: string;
}

export interface ManualRole {
  id: string;
  date: string;
  role: RoleKey;
  note: string;
}

export interface Member {
  id: string;
  name: string;
  kind: 'member' | 'guest'; // guests (sponsors, district leaders) are left out of the role tracker
  active: boolean;
  joinedOn: string;
  path: string; // Pathways path
  level: number; // current Pathways level 0-5
  phone: string;
  notes: string;
  manualRoles: ManualRole[]; // roles taken before the app existed
}

export interface Person {
  name: string;
  role: string;
  note: string;
}

export interface Settings {
  clubName: string;
  clubNumber: string;
  mission: string;
  defaultVenue: string;
  defaultFeeNote: string;
  sponsors: Person[];
  mentors: Person[];
  officers: Person[];
  speechDueWeeks: number; // VPE: flag members with no speech for this many weeks
  logoUrl: string; // LifeSMART club logo
  logoAssetId?: string;
  tmiLogoUrl: string; // Toastmasters International logo
  tmiLogoAssetId?: string;
}
