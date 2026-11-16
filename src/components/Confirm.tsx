import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

/** In-page confirm dialog (browser confirm()/alert() are blocked in some hosts). */
type Opts = { title: string; body?: string; ok?: string; danger?: boolean; cancel?: string | null };
const Ctx = createContext<(o: Opts) => Promise<boolean>>(async () => false);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<Opts | null>(null);
  const resolver = useRef<(v: boolean) => void>();
  const ask = useCallback(
    (o: Opts) =>
      new Promise<boolean>((res) => {
        resolver.current = res;
        setOpts(o);
      }),
    [],
  );
  const close = (v: boolean) => {
    resolver.current?.(v);
    setOpts(null);
  };
  return (
    <Ctx.Provider value={ask}>
      {children}
      {opts && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="cf-t" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => close(false)}>
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="cf-t" className="text-lg font-extrabold text-tm-ink">
              {opts.title}
            </h2>
            {opts.body && <p className="text-tm-muted">{opts.body}</p>}
            <div className="flex justify-end gap-2">
              {opts.cancel !== null && (
                <button type="button" className="btn-ghost" onClick={() => close(false)} autoFocus>
                  {opts.cancel ?? 'Cancel'}
                </button>
              )}
              <button type="button" className={opts.danger ? 'btn bg-red-700 text-white hover:bg-red-800' : 'btn-primary'} onClick={() => close(true)}>
                {opts.ok ?? 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export const useConfirm = () => useContext(Ctx);
