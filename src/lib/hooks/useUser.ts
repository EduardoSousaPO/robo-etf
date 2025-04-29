import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Profile } from '@/lib/supabase';
import { useAuth } from './useAuth';

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

export function useUser() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getBrowserClient();

  useEffect(() => {
    // Função para buscar o perfil do usuário
    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Buscar o perfil do usuário
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Erro ao buscar perfil:', error);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    // Só buscar o perfil se o estado de autenticação já tiver sido carregado
    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading, supabase]);

  const hasActiveSubscription = profile?.subscription_status === 'premium';

  return {
    user,
    profile,
    loading: loading || authLoading,
    hasActiveSubscription,
    isLoggedIn: !!user,
  };
} 