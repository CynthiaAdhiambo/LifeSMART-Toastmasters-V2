import { useEffect, useState } from 'react';

/**
 * Tiny hash router using plain hash names (#admin-roles, #m-<id>) so links work
 * on any static host and inside the hosted claude.ai copy (which only keeps plain #names).
 * Internally pages use paths like /admin/roles; toHash/fromHash convert.
 */
const MAP: [string, string][] = [
  ['/admin/roles', 'admin-roles'],
  ['/admin/members', 'admin-members'],
  ['/admin/settings', 'admin-club'],
  ['/admin', 'admin'],
];

export const toHash = (path: string) => {
  if (path === '/' || path === '') return '#';
  if (path.startsWith('/m/')) return '#m-' + path.slice(3);
  if (path.startsWith('/admin/meeting/')) return '#admin-meeting-' + path.slice(15);
  const hit = MAP.find(([p]) => p === path);
  return '#' + (hit ? hit[1] : '');
};

const fromHash = (hash: string) => {
  const h = hash.replace(/^#/, '');
  if (!h) return '/';
  if (h.startsWith('/')) return h.split('?')[0]; // old-style links still work
  if (h.startsWith('m-')) return '/m/' + h.slice(2);
  if (h.startsWith('admin-meeting-')) return '/admin/meeting/' + h.slice(14);
  const hit = MAP.find(([, n]) => n === h);
  return hit ? hit[0] : '/';
};

export function useHashRoute() {
  const [path, setPath] = useState(() => fromHash(window.location.hash));
  useEffect(() => {
    const on = () => {
      setPath(fromHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return path;
}

export const href = (path: string) => toHash(path);

export const go = (path: string) => {
  const h = toHash(path);
  if (h === '#') {
    try {
      history.pushState(null, '', window.location.pathname + window.location.search);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else window.location.hash = h;
};
