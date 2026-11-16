import { createClient, type SupabaseClient, type Session as AuthSession } from '@supabase/supabase-js';
import type { Backend } from './types';
import { ADMIN_USERNAME } from './types';
import type { Meeting, Member, Settings } from '../types';

/**
 * Supabase backend for the public deployment (Bolt / Netlify / Vercel).
 * Tables hold one JSON document per row (see supabase/schema.sql); row-level
 * security lets the public read published meetings + settings, and only the
 * signed-in admin read members or write anything.
 */
export function supabaseBackend(): Backend {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) || 'admin@lifesmart-toastmasters.org';
  let sb: SupabaseClient;
  let session: AuthSession | null = null;

  const must = <T>(r: { data: T; error: { message: string } | null }) => {
    if (r.error) throw new Error(r.error.message);
    return r.data;
  };

  return {
    mode: 'supabase',
    async init() {
      if (!url || !key) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see README).');
      sb = createClient(url, key);
      session = (await sb.auth.getSession()).data.session;
      sb.auth.onAuthStateChange((_e, s) => (session = s));
    },
    isAdmin: () => !!session,
    adminNotice: () => null,
    async login(username, password) {
      if (username.trim().toLowerCase() !== ADMIN_USERNAME) throw new Error('Wrong username or password.');
      const r = await sb.auth.signInWithPassword({ email: adminEmail, password });
      if (r.error) throw new Error('Wrong username or password.');
      session = r.data.session;
    },
    async logout() {
      await sb.auth.signOut();
      session = null;
    },

    async getSettings() {
      const rows = must(await sb.from('settings').select('data').eq('id', 1)) as { data: Settings }[];
      return rows[0]?.data ?? null;
    },
    async saveSettings(s) {
      must(await sb.from('settings').upsert({ id: 1, data: s }));
    },

    async listMeetings() {
      let q = sb.from('meetings').select('data').order('date', { ascending: false });
      if (!session) q = q.eq('published', true);
      const rows = must(await q) as { data: Meeting }[];
      return rows.map((r) => r.data);
    },
    async saveMeeting(m) {
      const data = { ...m, updatedAt: new Date().toISOString() };
      must(await sb.from('meetings').upsert({ id: m.id, date: m.date, published: m.published, data }));
    },
    async deleteMeeting(id) {
      must(await sb.from('meetings').delete().eq('id', id));
    },

    async listMembers() {
      const rows = must(await sb.from('members').select('data')) as { data: Member }[];
      return rows.map((r) => r.data);
    },
    async saveMember(m) {
      must(await sb.from('members').upsert({ id: m.id, data: m }));
    },
    async deleteMember(id) {
      must(await sb.from('members').delete().eq('id', id));
    },

    async uploadImage(file) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await sb.storage.from('posters').upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw new Error(up.error.message);
      const pub = sb.storage.from('posters').getPublicUrl(path);
      return { url: pub.data.publicUrl, assetId: path };
    },
    async deleteImage(assetId) {
      await sb.storage.from('posters').remove([assetId]);
    },
  };
}
