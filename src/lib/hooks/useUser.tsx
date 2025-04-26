import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabaseAuth } from '../supabase';

// Interface similar ao Clerk useUser hook para facilitar a migração
interface UseUserResult {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  user: User | null | undefined;
  session: Session | null | undefined;
}

export function useUser(): UseUserResult {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Verificar a sessão atual quando o componente é montado
    supabaseAuth.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoaded(true);
    });

    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoaded(true);
      }
    );

    // Limpar inscrição quando o componente for desmontado
    return () => subscription.unsubscribe();
  }, []);

  return {
    isLoaded,
    isSignedIn: user !== null && user !== undefined,
    user,
    session
  };
}

export default useUser; 