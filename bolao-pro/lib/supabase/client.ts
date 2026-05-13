'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Cliente Supabase para uso no browser (componentes 'use client').
 * Usa a ANON KEY pública.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
