import { useState } from 'react';
import { useData } from '../../lib/data';
import { backend } from '../../lib/backend';
import type { Person, Settings } from '../../lib/types';
import Icon from '../../components/Icon';
import { useSaver } from '../../components/useSaver';

function PeopleEditor({ title, people, onChange, notePlaceholder }: { title: string; people: Person[]; onChange: (p: Person[]) => void; notePlaceholder: string }) {
  const set = (i: number, patch: Partial<Person>) => onChange(people.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const mv = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= people.length) return;
    const a = [...people];
    [a[i], a[j]] = [a[j], a[i]];
    onChange(a);
  };
  return (
    <section className="card space-y-3 p-5">
      <h2 className="text-lg font-bold">{title}</h2>
      {people.map((p, i) => (
        <div key={i} className="grid gap-2 rounded-xl border border-tm-line p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <input className="input" placeholder="Name" aria-label="Name" value={p.name} onChange={(e) => set(i, { name: e.target.value })} />
          <input className="input" placeholder="Role" aria-label="Role" value={p.role} onChange={(e) => set(i, { role: e.target.value })} />
          <input className="input" placeholder={notePlaceholder} aria-label="Note" value={p.note} onChange={(e) => set(i, { note: e.target.value })} />
          <div className="flex gap-1">
            <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => mv(i, -1)} aria-label="Move up">
              <Icon name="up" size={16} />
            </button>
            <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => mv(i, 1)} aria-label="Move down">
              <Icon name="down" size={16} />
            </button>
            <button type="button" className="btn-danger btn-sm !px-2" onClick={() => onChange(people.filter((_, j) => j !== i))} aria-label={`Remove ${p.name}`}>
              <Icon name="trash" size={16} />
            </button>
          </div>
        </div>
      ))}
      <button type="button" className="btn-ghost btn-sm" onClick={() => onChange([...people, { name: '', role: '', note: '' }])}>
        <Icon name="plus" size={16} /> Add person
      </button>
    </section>
  );
}

function LogoField({ label, url, onChange }: { label: string; url: string; onChange: (url: string, assetId?: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div className="space-y-2">
      <span className="label">{label}</span>
      <div className="flex min-h-[96px] items-center justify-center rounded-xl bg-tm-blue p-3">
        {url ? <img src={url} alt={label} className="max-h-20 w-auto object-contain" /> : <span className="text-sm text-white/70">No logo yet</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className={`btn-ghost btn-sm cursor-pointer ${busy ? 'pointer-events-none opacity-60' : ''}`}>
          <Icon name="image" size={16} /> {busy ? 'Uploading…' : url ? 'Replace' : 'Upload'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              setErr('');
              try {
                const r = await backend.uploadImage(f);
                onChange(r.url, r.assetId);
              } catch (x) {
                setErr((x as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        {url && (
          <button type="button" className="btn-danger btn-sm" onClick={() => onChange('', undefined)}>
            Remove
          </button>
        )}
      </div>
      {err && <p className="text-sm font-semibold text-red-700">{err}</p>}
    </div>
  );
}

export default function SettingsAdmin() {
  const { settings, reload } = useData();
  const [s, setS] = useState<Settings>(structuredClone(settings));
  const { busy, msg, run } = useSaver();
  const up = (p: Partial<Settings>) => setS({ ...s, ...p });

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-extrabold text-tm-blue">Club settings</h1>
        <p className="text-tm-muted">Shown on every agenda page.</p>
      </div>
      <section className="card space-y-3 p-5">
        <h2 className="text-lg font-bold">Logos</h2>
        <p className="text-sm text-tm-muted">Shown in the header of every page. A PNG with a transparent background looks best on the blue header. Click Save settings after uploading.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <LogoField label="LifeSMART logo" url={s.logoUrl} onChange={(logoUrl, logoAssetId) => up({ logoUrl, logoAssetId })} />
          <LogoField label="Toastmasters International logo" url={s.tmiLogoUrl} onChange={(tmiLogoUrl, tmiLogoAssetId) => up({ tmiLogoUrl, tmiLogoAssetId })} />
        </div>
      </section>
      <section className="card grid gap-4 p-5 sm:grid-cols-2">
        <label>
          <span className="label">Club name</span>
          <input className="input" value={s.clubName} onChange={(e) => up({ clubName: e.target.value })} />
        </label>
        <label>
          <span className="label">Club number</span>
          <input className="input" value={s.clubNumber} onChange={(e) => up({ clubNumber: e.target.value })} />
        </label>
        <label>
          <span className="label">Default venue for new meetings</span>
          <input className="input" value={s.defaultVenue} onChange={(e) => up({ defaultVenue: e.target.value })} />
        </label>
        <label>
          <span className="label">Default fee / note</span>
          <input className="input" value={s.defaultFeeNote} onChange={(e) => up({ defaultFeeNote: e.target.value })} />
        </label>
        <label>
          <span className="label">Flag members with no speech for (weeks)</span>
          <input type="number" min={1} max={52} className="input" value={s.speechDueWeeks} onChange={(e) => up({ speechDueWeeks: Math.max(1, Number(e.target.value) || 6) })} />
        </label>
        <label className="sm:col-span-2">
          <span className="label">Club mission</span>
          <textarea className="input" rows={3} value={s.mission} onChange={(e) => up({ mission: e.target.value })} />
        </label>
      </section>
      <PeopleEditor title="Club sponsors" people={s.sponsors} onChange={(sponsors) => up({ sponsors })} notePlaceholder="Short line (optional)" />
      <PeopleEditor title="Club mentors" people={s.mentors} onChange={(mentors) => up({ mentors })} notePlaceholder="Short line (optional)" />
      <PeopleEditor title="Club leadership team" people={s.officers} onChange={(officers) => up({ officers })} notePlaceholder="Short line (optional)" />
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="btn-primary"
          disabled={busy}
          onClick={() =>
            run(async () => {
              await backend.saveSettings({
                ...s,
                sponsors: s.sponsors.filter((p) => p.name.trim()),
                mentors: s.mentors.filter((p) => p.name.trim()),
                officers: s.officers.filter((p) => p.name.trim()),
              });
              await reload();
            }, 'Settings saved')
          }
        >
          Save settings
        </button>
        {msg && <span className={`text-sm font-semibold ${msg.kind === 'ok' ? 'text-emerald-700' : 'text-red-700'}`}>{msg.text}</span>}
      </div>
    </div>
  );
}
