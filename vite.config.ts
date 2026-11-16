import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build`         -> normal multi-file build for Bolt / Netlify / Vercel (Supabase backend)
// `npm run build:claude`  -> one self-contained index.html for the hosted Claude version
export default defineConfig(({ mode }) => ({
  plugins: mode === 'claude' ? [react(), viteSingleFile()] : [react()],
  build: { outDir: mode === 'claude' ? 'dist-claude' : 'dist' },
}));
