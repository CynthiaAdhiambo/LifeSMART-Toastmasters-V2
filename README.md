# LifeSMART Toastmasters — Meeting Agenda App

A responsive agenda website with an admin area for:

- **Meetings**: date, theme, venue, fee, Word of the Day, publish/unpublish.
- **Sessions**: one or many per day (e.g. a charter ceremony plus a club meeting). Each session has its own start time and layout:
  - **Table**: the regular meeting view.
  - **Timeline cards**: the charter / special-event view.
- **Agenda items**: title, description, duration, role, and the person taking it. Start times are worked out automatically from the session start and the durations.
- **Posters**: upload as many as you like and link each one to a session or to the whole day. Visitors can page through them and open them full size.
- **Members**: club members (tracked) and guests/dignitaries (not tracked), with Pathways path and level.
- **Role tracker (for the VP Education)**: shows each member's last speech and the last time they took each role (Toastmaster, Evaluator, General Evaluator, Table Topics Master, Timer, Ah Counter, Grammarian). It flags members with no speech in *N* weeks and suggests who has waited longest for each role. Roles from before the app can be logged by hand.
- **Club settings**: club name and number, mission, sponsors, mentors, leadership team.

The public home page shows the next published meeting. Past agendas are listed for admins under Admin → Meetings → Past meetings. The admin area is at `#/admin` (there's also an "Admin" link in the footer).

---

## Admin login

| Username | Password |
|---|---|
| `admin` | *(the password you were given; it is not stored in this code)* |

---

## Deploying with Supabase (Bolt, Netlify, Vercel…)

### 1. Create the database
1. Create a free project at <https://supabase.com>.
2. **SQL Editor → New query**: paste `supabase/schema.sql`, then **Run**. This creates the tables, the security rules and a public `posters` storage bucket.
3. New query again: paste `supabase/seed.sql`, then **Run**. This loads the club settings, 22 members and both existing agendas (the 10 Oct Charter Party and the 14 Nov regular meeting).

### 2. Create the admin account
1. **Authentication → Users → Add user → Create new user**
   - Email: `admin@lifesmart-toastmasters.org` (or another address; it must match `VITE_ADMIN_EMAIL`)
   - Password: the admin password
   - Tick **Auto Confirm User**
2. **Authentication → Sign In / Providers**: turn **off** "Allow new users to sign up". The admin account then stays the only login.

On the login screen you type the username `admin`. The app signs you in with the email above behind the scenes.

### 3. Connect the app
Copy `.env.example` to `.env` (or add these under your host's environment variables). The values come from Supabase under **Project Settings → API**:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_ADMIN_EMAIL=admin@lifesmart-toastmasters.org
```

### 4. Run / build
```
npm install
npm run dev      # local preview at http://localhost:5173
npm run build    # production files in dist/
```
**On Bolt:** import this folder, connect Supabase from Bolt's Supabase integration (or set the three variables above), and deploy.

### Changing the admin password
In Supabase: **Authentication → Users → admin → Reset/Update password**. No code change is needed.

---

## Hosted copy on Claude
`npm run build:claude` produces one self-contained file, `dist-claude/index.html`. That's the live copy hosted on claude.ai, which stores its data in the artifact's own database. Visitors to that copy need a claude.ai account. Only people with Editor access can save, and the admin password screen sits on top of that.

## Project layout
```
src/lib/types.ts            data model (Meeting → Sessions → Items, Posters, Members, Settings)
src/lib/roles.ts            role list + which roles the tracker follows
src/lib/history.ts          role history + "who's due" logic
src/lib/backend/            supabase.ts (public deployment) and claude.ts (hosted copy)
src/pages/PublicMeeting.tsx the public agenda page
src/pages/admin/            Meetings, MeetingEditor, Members, RoleTracker, Settings
supabase/schema.sql         tables, security rules, storage bucket
supabase/seed.sql           starting data (regenerate with: npm run seed:sql)
scripts/seed-data.mjs       the starting data in readable form
```
