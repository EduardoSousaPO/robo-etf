import { User } from '@supabase/auth-helpers-nextjs';
import { getBrowserClient, createServiceClient } from './supabase-client';

// Interface para padronizar os retornos de autenticação
interface AuthResponse<T = unknown> {
  data: T | null;
  error: Error | null;
}

/**
 * Faz login do usuário
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const supabase = getBrowserClient();
    return await supabase.auth.signInWithPassword({ email, password });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Registra um novo usuário
 */
export async function signUp(email: string, password: string): Promise<AuthResponse> {
  try {
    const supabase = getBrowserClient();
    const result = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (result.error) {
      console.error('Erro durante o cadastro:', result.error);
    } else if (result.data?.user) {
      // Criar perfil do usuário automaticamente
      try {
        const adminClient = createServiceClient();
        await adminClient.from('profiles').upsert({
          id: result.data.user.id,
          subscription_status: 'free',
          created_at: new Date().toISOString()
        });
      } catch (profileError) {
        console.error('Erro ao criar perfil do usuário:', profileError);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Exceção não tratada durante o cadastro:', error);
    return { error: error instanceof Error ? error : new Error(String(error)), data: null };
  }
}

/**
 * Faz logout do usuário
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const supabase = getBrowserClient();
    const { error } = await supabase.auth.signOut();
    return { data: null, error };
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Obtém a sessão atual do usuário
 */
export async function getSession(): Promise<AuthResponse> {
  try {
    const supabase = getBrowserClient();
    return await supabase.auth.getSession();
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/**
 * Obtém o usuário atual
 */
export async function getUser(): Promise<User | null> {
  try {
    const supabase = getBrowserClient();
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    return null;
  }
}

/**
 * Verifica token JWT do usuário (útil para APIs)
 */
export async function verifyUserToken(token: string): Promise<User | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Erro ao verificar token do usuário:', error);
    return null;
  }
} 