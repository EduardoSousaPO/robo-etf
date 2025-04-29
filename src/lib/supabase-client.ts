import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Cliente para componentes no navegador (lado do cliente)
let browserClient: any = null;

export function getBrowserClient() {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Erro: Variáveis de ambiente do Supabase não encontradas!");
    throw new Error("Variáveis de ambiente do Supabase não configuradas");
  }
  
  browserClient = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
  
  return browserClient;
}

// Cliente para componentes no cliente (com auth-helpers)
export function getClientComponentClient() {
  return createClientComponentClient();
}

// Cliente com chave de serviço (acesso administrativo)
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Erro: Variáveis de ambiente do Supabase não encontradas para Service Client!");
    throw new Error("Variáveis de ambiente do Supabase não configuradas");
  }
  
  return createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Cliente para componentes no servidor (SSR)
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Erro: Variáveis de ambiente do Supabase não encontradas para Server Client!");
    throw new Error("Variáveis de ambiente do Supabase não configuradas");
  }

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

// Cliente para middleware.ts
export function createMiddlewareClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Erro: Variáveis de ambiente do Supabase não encontradas para Middleware!");
    throw new Error("Variáveis de ambiente do Supabase não configuradas");
  }

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
      },
    }
  );
} 