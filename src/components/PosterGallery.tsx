import { useEffect, useState } from 'react';
import type { Poster } from '../lib/types';
import Icon from './Icon';

/** Poster carousel with a full-size viewer. Handles any number of posters. */
export default function PosterGallery({ posters, labelFor }: { posters: Poster[]; labelFor: (p: Poster) => string }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const n = posters.length;
  useEffect(() => setI(0), [n]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key === 'ArrowRight') setI((x) => (x + 1) % n);
      if (e.key === 'ArrowLeft') setI((x) => (x - 1 + n) % n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, n]);
  if (!n) return null;
  const p = posters[Math.min(i, n - 1)];
  const label = labelFor(p);

  return (
    <div className="overflow-hidden rounded-2xl border border-tm-line bg-white">
      <button type="button" onClick={() => setOpen(true)} className="group relative block w-full bg-tm-blue" aria-label={`View poster full size${label ? ': ' + label : ''}`}>
        <img src={p.url} alt={p.caption || label || 'Meeting poster'} className="block max-h-[560px] w-full object-contain" />
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-sm font-semibold text-white">
          <Icon name="expand" size={16} /> View full size
        </span>
      </button>
      <div className="flex items-center gap-2 p-3">
        <div className="min-w-0 flex-1">
          {label && <div className="eyebrow text-tm-maroon">{label}</div>}
          {p.caption && <div className="truncate text-sm text-tm-muted">{p.caption}</div>}
        </div>
        {n > 1 && (
          <div className="flex items-center gap-1">
            <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => setI((i - 1 + n) % n)} aria-label="Previous poster">
              <Icon name="left" />
            </button>
            <span className="min-w-[44px] text-center text-sm font-semibold text-tm-muted">
              {i + 1} / {n}
            </span>
            <button type="button" className="btn-ghost btn-sm !px-2" onClick={() => setI((i + 1) % n)} aria-label="Next poster">
              <Icon name="right" />
            </button>
          </div>
        )}
      </div>

      {open && (
        <div role="dialog" aria-modal="true" aria-label="Poster" className="fixed inset-0 z-50 flex flex-col bg-black/90" onClick={() => setOpen(false)}>
          <div className="flex items-center justify-between p-3 text-white" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm font-semibold">
              {label} {n > 1 ? `· ${i + 1} of ${n}` : ''}
            </span>
            <button type="button" className="btn !min-h-[44px] !px-3 text-white hover:bg-white/10" onClick={() => setOpen(false)} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center gap-2 p-2" onClick={(e) => e.stopPropagation()}>
            {n > 1 && (
              <button type="button" className="btn !px-2 text-white hover:bg-white/10" onClick={() => setI((i - 1 + n) % n)} aria-label="Previous poster">
                <Icon name="left" size={28} />
              </button>
            )}
            <img src={p.url} alt={p.caption || label || 'Meeting poster'} className="max-h-full max-w-full object-contain" />
            {n > 1 && (
              <button type="button" className="btn !px-2 text-white hover:bg-white/10" onClick={() => setI((i + 1) % n)} aria-label="Next poster">
                <Icon name="right" size={28} />
              </button>
            )}
          </div>
          {p.caption && <p className="p-3 text-center text-sm text-white/80">{p.caption}</p>}
        </div>
      )}
    </div>
  );
}
