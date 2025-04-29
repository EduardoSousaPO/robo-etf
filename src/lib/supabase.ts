import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY } from './constants';

// Tipos para as tabelas do Supabase
export type Profile = {
  id: string;
  name: string | null;
  risk_score: number | null;
  created_at: string;
  subscription_status: 'free' | 'premium' | null;
  subscription_id: string | null;
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

// Configuração com valores fixos para desenvolvimento para garantir que funcione
const supabaseUrl = 'https://iikdiavzocnpspebjasp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2RpYXZ6b2NucHNwZWJqYXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MTc1NzQsImV4cCI6MjA2MTE5MzU3NH0.WLBS9-isTcTbGr7OE1GCRQZN58nPxeHVpY5B4Sjpn-0';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2RpYXZ6b2NucHNwZWJqYXNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTYxNzU3NCwiZXhwIjoyMDYxMTkzNTc0fQ.bwQZqwTpEvmFdVMzgNxPovEvCaTHInBoXEKfFTTquJg';

// Verificação apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  console.log('ℹ️ Configuração Supabase:', { 
    url: !!supabaseUrl ? 'Configurado' : 'Não configurado',
    anonKey: !!supabaseAnonKey ? 'Configurado' : 'Não configurado',
    serviceKey: !!supabaseServiceKey ? 'Configurado' : 'Não configurado'
  });
}

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
  supabase = createClient(supabaseUrl, supabaseServiceKey);
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
      update: () => ({
        eq: () => ({
          select: () => ({
            single: async () => ({ data: null, error: new Error('Cliente Supabase não inicializado') })
          })
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

// Funções auxiliares para interagir com o banco de dados
export async function getProfileById(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Código para 'Not found'
        console.warn(`Perfil não encontrado para o usuário ${userId}`);
        return null;
      }
      throw error;
    }
    return data as Profile;
  } catch (error) {
    console.error(`Erro ao buscar perfil do usuário ${userId}:`, error);
    throw error;
  }
}

export async function createOrUpdateProfile(profile: Partial<Profile> & { id: string }): Promise<Profile> {
  try {
    // Garante que o risk_score seja um número ou null
    const riskScore = typeof profile.risk_score === 'number' ? profile.risk_score : null;
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ ...profile, risk_score: riskScore })
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  } catch (error) {
    console.error('Erro ao criar/atualizar perfil:', error);
    throw error;
  }
}

export async function getPortfoliosByUserId(userId: string): Promise<Portfolio[]> {
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

export async function createPortfolio(portfolio: Omit<Portfolio, 'id' | 'created_at'>): Promise<Portfolio> {
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

// Função para atualizar status da assinatura
export async function updateSubscriptionStatus(userId: string, status: 'free' | 'premium', subscriptionId?: string): Promise<Profile> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        subscription_status: status,
        subscription_id: subscriptionId || null
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  } catch (error) {
    console.error(`Erro ao atualizar status da assinatura para usuário ${userId}:`, error);
    throw error;
  }
}

// Função para verificar se as credenciais do Supabase estão configuradas
export const checkSupabaseCredentials = () => {
  return {
    hasCredentials: !!supabaseUrl && !!supabaseAnonKey,
    url: supabaseUrl,
    key: supabaseAnonKey
  };
};

// Funções de autenticação
export const signIn = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export async function signUp(email: string, password: string) {
  try {
    const result = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (result.error) {
      console.error('Erro durante o cadastro:', result.error);
      
      // Verificar se é um erro de banco de dados
      if (result.error.message.includes('Database error')) {
        console.error('Erro de banco de dados detectado:', result.error);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Exceção não tratada durante o cadastro:', error);
    return { error, data: null };
  }
}

export const signOut = async () => {
  return supabase.auth.signOut();
};

export const getSession = async () => {
  return supabase.auth.getSession();
};

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Funções para lidar com dados
export const createRecord = async (table: string, data: any) => {
  return supabase
    .from(table)
    .insert(data)
    .select();
};

export const updateRecord = async (table: string, id: string, data: any) => {
  return supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select();
};

export const deleteRecord = async (table: string, id: string) => {
  return supabase
    .from(table)
    .delete()
    .eq('id', id);
};

export const getRecords = async (table: string) => {
  return supabase
    .from(table)
    .select('*');
};

export const getRecordById = async (table: string, id: string) => {
  return supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();
};

export const getRecordsByField = async (table: string, field: string, value: any) => {
  return supabase
    .from(table)
    .select('*')
    .eq(field, value);
};

// Funções para armazenamento
export const uploadFile = async (bucket: string, path: string, file: File) => {
  return supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
};

export const getFileUrl = (bucket: string, path: string) => {
  return supabase.storage
    .from(bucket)
    .getPublicUrl(path);
};

export const deleteFile = async (bucket: string, path: string) => {
  return supabase.storage
    .from(bucket)
    .remove([path]);
};

// Funções para tempo real
export const subscribeToTable = (table: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
};

export const unsubscribe = (subscription: any) => {
  supabase.removeChannel(subscription);
};

export default supabase;

