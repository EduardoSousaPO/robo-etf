import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// Função para criar cliente Supabase com autenticação anônima
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Função para criar cliente Supabase Admin (usando a chave de serviço)
export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Função para obter informações do usuário atual (combinando Clerk e Supabase)
export async function getCurrentUserWithProfile() {
  try {
    // Obter usuário do Clerk
    const user = await currentUser();

    if (!user) {
      return { user: null, profile: null };
    }

    // Obter perfil do Supabase usando a chave de serviço
    const supabase = createSupabaseAdmin();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      return { user, profile: null };
    }

    return {
      user,
      profile: profile || null,
    };
  } catch (error) {
    console.error('Erro ao obter usuário atual com perfil:', error);
    return { user: null, profile: null };
  }
}
