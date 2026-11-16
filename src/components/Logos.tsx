import type { Settings } from '../lib/types';

/** Club logo (left) and Toastmasters International logo (right); fall back to text until uploaded. */
export function ClubLogo({ settings, className = 'h-11' }: { settings: Settings; className?: string }) {
  if (settings.logoUrl) return <img src={settings.logoUrl} alt={settings.clubName} className={`${className} w-auto object-contain`} />;
  return null;
}

export function TmiLogo({ settings, className = 'h-12' }: { settings: Settings; className?: string }) {
  if (settings.tmiLogoUrl) return <img src={settings.tmiLogoUrl} alt="Toastmasters International" className={`${className} w-auto object-contain`} />;
  return <span className="hidden rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-[#D6E4EF] sm:inline">Toastmasters International</span>;
}
