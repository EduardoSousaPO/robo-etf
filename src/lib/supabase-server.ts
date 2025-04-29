import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Cliente para componentes de servidor
export async function createServerClient() {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
}

// Cliente para routes.ts (API routes)
export function createRouteHandlerClient() {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
} 