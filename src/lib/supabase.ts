import { createClient } from '@supabase/supabase-js';

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

// Inicialização do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Funções auxiliares para interagir com o banco de dados
export async function getProfileById(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function createOrUpdateProfile(profile: Partial<Profile> & { id: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function getPortfoliosByUserId(userId: string) {
  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Portfolio[];
}

export async function createPortfolio(portfolio: Omit<Portfolio, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('portfolios')
    .insert(portfolio)
    .select()
    .single();

  if (error) throw error;
  return data as Portfolio;
}
