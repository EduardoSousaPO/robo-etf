import { useState, useEffect } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { signOut as authSignOut } from '../auth';

// Função local para criar cliente do Supabase no navegador
function getBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iikdiavzocnpspebjasp.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2RpYXZ6b2NucHNwZWJqYXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MTc1NzQsImV4cCI6MjA2MTE5MzU3NH0.c7Yw_UQenZABl5tg5AtOGaQbv_VE2gu3Wbo6zPJ3rAw';
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getBrowserClient();
  
  useEffect(() => {
    // Função para buscar o usuário atual
    const getUser = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user || null);
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    // Chamar a função para obter o usuário atual
    getUser();

    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'SIGNED_IN' && session) {
          setUser(session.user);
        }
      }
    );

    // Limpar o listener quando o componente for desmontado
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Função para fazer logout do usuário
  const signOut = async (): Promise<{error: Error | null}> => {
    try {
      const { error } = await authSignOut();
      return { error };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return { error: error as Error };
    }
  };

  return { user, loading, signOut };
} 