// Generates supabase/seed.sql (and scripts/seed.json) from scripts/seed-data.mjs.
import { writeFileSync } from 'node:fs';
import { members, meetings, settings } from './seed-data.mjs';

const q = (o) => "'" + JSON.stringify(o).replace(/'/g, "''") + "'::jsonb";
const lines = [
  '-- Starting data for LifeSMART Toastmasters (safe to re-run: existing rows are updated).',
  `insert into public.settings (id, data) values (1, ${q(settings)}) on conflict (id) do update set data = excluded.data;`,
  ...members.map((m) => `insert into public.members (id, data) values ('${m.id}', ${q(m)}) on conflict (id) do update set data = excluded.data;`),
  ...meetings.map(
    (m) => `insert into public.meetings (id, date, published, data) values ('${m.id}', '${m.date}', ${m.published}, ${q(m)}) on conflict (id) do update set date = excluded.date, published = excluded.published, data = excluded.data;`,
  ),
];
writeFileSync(new URL('../supabase/seed.sql', import.meta.url), lines.join('\n') + '\n');
writeFileSync(new URL('./seed.json', import.meta.url), JSON.stringify({ settings, members, meetings }, null, 2));
console.log(`seed.sql: 1 settings row, ${members.length} members, ${meetings.length} meetings`);
