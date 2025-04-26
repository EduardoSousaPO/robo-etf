import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

// Define uma interface para representar o tipo de usuário com os dados de perfil
export interface UserWithProfile extends User {
  profile?: {
    id: string;
    name: string;
    risk_score: number;
    email: string;
  };
}

export function useUser() {
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Função para buscar os dados do usuário e perfil
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        
        // Buscar sessão atual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erro ao verificar sessão:', sessionError);
          return;
        }
        
        if (!session) {
          setUser(null);
          setIsSignedIn(false);
          setIsLoading(false);
          return;
        }
        
        setIsSignedIn(true);
        
        // Buscar perfil do usuário
        if (session.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Erro ao buscar perfil:', profileError);
          }
          
          // Combinar usuário com dados do perfil
          const userWithProfile: UserWithProfile = {
            ...session.user,
            profile: profile || undefined
          };
          
          setUser(userWithProfile);
        }
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Buscar usuário ao montar o componente
    fetchUser();
    
    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      fetchUser();
    });
    
    // Limpar listener ao desmontar
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Função para logout
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/sign-in');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return {
    user,
    isLoading,
    isSignedIn,
    signOut
  };
} 