import type { RoleKey } from './types';

export interface RoleDef {
  key: RoleKey;
  label: string;
  group: 'Speaking' | 'Evaluation' | 'Meeting roles' | 'Leadership' | 'Other';
  tracked: boolean; // shown as a column / suggestion in the role tracker
}

export const ROLES: RoleDef[] = [
  { key: 'toastmaster', label: 'Toastmaster of the Day', group: 'Meeting roles', tracked: true },
  { key: 'speaker', label: 'Speaker', group: 'Speaking', tracked: true },
  { key: 'evaluator', label: 'Speech Evaluator', group: 'Evaluation', tracked: true },
  { key: 'general_evaluator', label: 'General Evaluator', group: 'Evaluation', tracked: true },
  { key: 'table_topics_master', label: 'Table Topics Master', group: 'Meeting roles', tracked: true },
  { key: 'table_topics_speaker', label: 'Table Topics Speaker', group: 'Speaking', tracked: false },
  { key: 'timer', label: 'Timer', group: 'Meeting roles', tracked: true },
  { key: 'ah_counter', label: 'Ah Counter', group: 'Meeting roles', tracked: true },
  { key: 'grammarian', label: 'Grammarian', group: 'Meeting roles', tracked: true },
  { key: 'presiding_officer', label: 'Presiding Officer', group: 'Leadership', tracked: false },
  { key: 'sergeant_at_arms', label: 'Sergeant at Arms', group: 'Leadership', tracked: false },
  { key: 'president', label: 'Club President', group: 'Leadership', tracked: false },
  { key: 'vpe', label: 'Vice President Education', group: 'Leadership', tracked: false },
  { key: 'officer', label: 'Club Officer', group: 'Leadership', tracked: false },
  { key: 'guest_speaker', label: 'Guest Speaker / Dignitary', group: 'Other', tracked: false },
  { key: 'all', label: 'All members', group: 'Other', tracked: false },
  { key: 'other', label: 'Other', group: 'Other', tracked: false },
];

export const roleLabel = (k: RoleKey) => ROLES.find((r) => r.key === k)?.label ?? 'Other';
export const TRACKED = ROLES.filter((r) => r.tracked);
