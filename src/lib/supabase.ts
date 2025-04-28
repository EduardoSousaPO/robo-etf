import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './constants';

// Tipos para as tabelas do Supabase
export type Profile = {
  id: string;
  name: string | null;
  risk_score: number | null;
  created_at: string;
};

export type Portfolio = {
  id: string;
  user_id: string;
  weights: Record<string, number>;
  metrics: {
    return: number;
    volatility: number;
    sharpe: number;
  };
  rebalance_date: string | null;
  created_at: string;
};

// Inicialização do cliente Supabase com valores diretos para depuração
const supabaseUrl = SUPABASE_URL;
const supabaseKey = SUPABASE_ANON_KEY;

// Usar a chave de anon para o cliente público
const supabaseAnonKey = SUPABASE_ANON_KEY;

// Cliente para autenticação e acesso público
export let supabaseAuth: SupabaseClient;
try {
  supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'robo-etf-auth',
    }
  });
} catch (error) {
  console.error('Erro ao criar cliente de autenticação Supabase:', error);
  // Criar um cliente dummy para evitar erros de "is not defined"
  supabaseAuth = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: new Error('Cliente Supabase não inicializado') }),
      signUp: async () => ({ data: null, error: new Error('Cliente Supabase não inicializado') }),
      signOut: async () => ({ error: null })
    }
  } as unknown as SupabaseClient;
}

// Cliente para acesso admin (usar apenas no servidor)
export let supabase: SupabaseClient;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  console.error('Erro ao criar cliente admin Supabase:', error);
  // Criar um cliente dummy para evitar erros de "is not defined"
  supabase = {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: new Error('Cliente Supabase não inicializado') }),
          order: () => ({ data: [], error: null })
        }),
        order: () => ({ data: [], error: null })
      }),
      insert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: new Error('Cliente Supabase não inicializado') })
        })
      }),
      upsert: () => ({
        select: () => ({
          single: async () => ({ data: null, error: new Error('Cliente Supabase não inicializado') })
        })
      })
    })
  } as unknown as SupabaseClient;
}

// Funções de autenticação
export async function signUp(email: string, password: string, name: string) {
  try {
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        }
      }
    });
    
    if (error) throw error;
    
    // Criar perfil para o usuário
    if (data?.user) {
      try {
        await createOrUpdateProfile({
          id: data.user.id,
          name: name,
          risk_score: 3 // Valor padrão para novos usuários
        });
      } catch (profileError) {
        console.error('Erro ao criar perfil:', profileError);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Erro no processo de cadastro:', error);
    throw error;
  }
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro no processo de login:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    const { error } = await supabaseAuth.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
}

// Hook para obter usuário atual (lado cliente)
export function useSupabaseAuth() {
  return supabaseAuth.auth;
}

// Função para obter usuário atual (lado servidor)
export async function getCurrentUser() {
  try {
    const { data } = await supabaseAuth.auth.getSession();
    return data.session?.user || null;
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return null;
  }
}

// Funções auxiliares para interagir com o banco de dados
export async function getProfileById(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as Profile;
  } catch (error) {
    console.error(`Erro ao buscar perfil do usuário ${userId}:`, error);
    throw error;
  }
}

export async function createOrUpdateProfile(profile: Partial<Profile> & { id: string }) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  } catch (error) {
    console.error('Erro ao criar/atualizar perfil:', error);
    throw error;
  }
}

export async function getPortfoliosByUserId(userId: string) {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Portfolio[];
  } catch (error) {
    console.error(`Erro ao buscar carteiras do usuário ${userId}:`, error);
    throw error;
  }
}

export async function createPortfolio(portfolio: Omit<Portfolio, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .insert(portfolio)
      .select()
      .single();

    if (error) throw error;
    return data as Portfolio;
  } catch (error) {
    console.error('Erro ao criar carteira:', error);
    throw error;
  }
}
