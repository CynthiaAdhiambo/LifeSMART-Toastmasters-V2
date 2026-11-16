import { claudeBackend } from './claude';
import { supabaseBackend } from './supabase';
import type { Backend } from './types';

export const backend: Backend = import.meta.env.VITE_BACKEND === 'claude' ? claudeBackend() : supabaseBackend();
export type { Backend };
