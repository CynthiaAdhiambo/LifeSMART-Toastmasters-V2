import type { Meeting, Member, Settings } from '../types';

export interface Backend {
  mode: 'supabase' | 'claude';
  /** Resolves once the backend can be used; rejects with a readable message if it can't. */
  init(): Promise<void>;
  isAdmin(): boolean;
  login(username: string, password: string): Promise<void>;
  logout(): Promise<void>;
  /** Extra note shown in the admin area (e.g. why saving is blocked). */
  adminNotice(): string | null;

  getSettings(): Promise<Settings | null>;
  saveSettings(s: Settings): Promise<void>;

  listMeetings(): Promise<Meeting[]>; // public: published only; admin: all
  saveMeeting(m: Meeting): Promise<void>;
  deleteMeeting(id: string): Promise<void>;

  listMembers(): Promise<Member[]>; // admin only
  saveMember(m: Member): Promise<void>;
  deleteMember(id: string): Promise<void>;

  uploadImage(file: File): Promise<{ url: string; assetId?: string }>;
  deleteImage(assetId: string): Promise<void>;
}

export const ADMIN_USERNAME = 'admin';
