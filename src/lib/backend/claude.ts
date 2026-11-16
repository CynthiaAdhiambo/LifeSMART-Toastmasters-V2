import type { Backend } from './types';
import { ADMIN_USERNAME } from './types';
import type { Meeting, Member, Settings } from '../types';

/* Minimal typings for the hosted page runtime (window.claude.use). */
type Snap = { id: string; exists: boolean; data(): Record<string, unknown> | undefined };
type DocRef = { get(): Promise<Snap>; set(d: Record<string, unknown>): Promise<void>; delete(): Promise<void> };
type ColRef = { doc(id?: string): DocRef; get(): Promise<{ docs: Snap[] }> };
type DB = { doc(p: string): DocRef; collection(p: string): ColRef };
type UserCap = { canEdit(): Promise<boolean> | boolean; isOwner(): Promise<boolean> | boolean };
type Assets = { upload(b: Blob): Promise<{ id: string; url: string }>; delete(id: string): Promise<void> };
declare global {
  interface Window {
    claude?: { use(name: string): Promise<unknown> };
  }
}

// SHA-256 of the admin password. The hosted page runs in the browser, so this
// gate keeps the admin screens tidy; the real write protection is the
// artifact's sharing level (only the owner and Editors can save).
const ADMIN_HASH = 'b0e84005939751cbe10cc78c158a16ca9963e295e10e9471d75ab8b0f2956fe2';
const FLAG = 'lst-admin';

const sha256 = async (s: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
};
const store = {
  get: () => {
    try {
      return sessionStorage.getItem(FLAG) === '1';
    } catch {
      return false;
    }
  },
  set: (v: boolean) => {
    try {
      if (v) sessionStorage.setItem(FLAG, '1');
      else sessionStorage.removeItem(FLAG);
    } catch {
      /* storage blocked: stay signed in for this page view only */
    }
  },
};

const withTimeout = <T>(p: Promise<T>, ms: number, msg: string) =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(msg)), ms))]);

export function claudeBackend(): Backend {
  let db: DB | null = null;
  let user: UserCap | null = null;
  let assets: Assets | null = null;
  let canEdit = false;
  let admin = store.get();

  const plain = <T>(s: Snap) => JSON.parse(JSON.stringify(s.data() ?? {})) as T;
  const clean = (o: unknown) => JSON.parse(JSON.stringify(o)) as Record<string, unknown>;
  const need = () => {
    if (!db) throw new Error('The database is not available in this view.');
    return db;
  };
  const writeErr = (e: unknown) => {
    const code = (e as { code?: string })?.code;
    if (code === 'invalid_argument' && !canEdit) return new Error('Your Claude account can view this page but not save changes. Ask the owner to give you Editor access.');
    return new Error((e as { message?: string })?.message || 'Could not save.');
  };

  return {
    mode: 'claude',
    async init() {
      if (!window.claude) throw new Error('Open this page from its claude.ai link to load the agenda.');
      db = (await withTimeout(window.claude.use('db'), 12000, 'The agenda database took too long to answer. Refresh to try again.')) as DB | null;
      if (!db) throw new Error('Sign in to claude.ai to view this agenda.');
      user = (await window.claude.use('user')) as UserCap | null;
      assets = (await window.claude.use('assets')) as Assets | null;
      try {
        canEdit = user ? !!(await user.canEdit()) : false;
      } catch {
        canEdit = false;
      }
    },
    isAdmin: () => admin,
    adminNotice: () =>
      canEdit ? null : 'Your Claude account has view-only access to this page, so changes will not save. The owner can give you Editor access from Share.',
    async login(username, password) {
      const ok = username.trim().toLowerCase() === ADMIN_USERNAME && (await sha256(password)) === ADMIN_HASH;
      if (!ok) throw new Error('Wrong username or password.');
      admin = true;
      store.set(true);
    },
    async logout() {
      admin = false;
      store.set(false);
    },

    async getSettings() {
      const s = await need().doc('config/settings').get();
      return s.exists ? plain<Settings>(s) : null;
    },
    async saveSettings(s) {
      try {
        await need().doc('config/settings').set(clean(s));
      } catch (e) {
        throw writeErr(e);
      }
    },

    async listMeetings() {
      const snap = await need().collection('meetings').get();
      const all = snap.docs.filter((d) => d.exists).map((d) => plain<Meeting>(d));
      return (admin ? all : all.filter((m) => m.published)).sort((a, b) => b.date.localeCompare(a.date));
    },
    async saveMeeting(m) {
      try {
        await need().doc('meetings/' + m.id).set(clean({ ...m, updatedAt: new Date().toISOString() }));
      } catch (e) {
        throw writeErr(e);
      }
    },
    async deleteMeeting(id) {
      try {
        await need().doc('meetings/' + id).delete();
      } catch (e) {
        throw writeErr(e);
      }
    },

    async listMembers() {
      const snap = await need().collection('members').get();
      return snap.docs.filter((d) => d.exists).map((d) => plain<Member>(d));
    },
    async saveMember(m) {
      try {
        await need().doc('members/' + m.id).set(clean(m));
      } catch (e) {
        throw writeErr(e);
      }
    },
    async deleteMember(id) {
      try {
        await need().doc('members/' + id).delete();
      } catch (e) {
        throw writeErr(e);
      }
    },

    async uploadImage(file) {
      if (!assets) throw new Error('Uploading needs Editor access to this page.');
      const r = await assets.upload(file);
      return { url: r.url || '/_blob/' + r.id, assetId: r.id };
    },
    async deleteImage(assetId) {
      if (assets) await assets.delete(assetId).catch(() => undefined);
    },
  };
}
