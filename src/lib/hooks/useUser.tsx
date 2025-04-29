import { User, Session } from '@supabase/supabase-js';
import { useAuth } from './useAuth';

// Interface similar ao Clerk useUser hook para facilitar a migração
interface UseUserResult {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  user: User | null | undefined;
  session: Session | null | undefined;
}

export function useUser(): UseUserResult {
  const { user, loading } = useAuth();
  
  return {
    isLoaded: !loading,
    isSignedIn: !!user,
    user: user,
    session: null // Não estamos retornando a sessão explicitamente no useAuth
  };
}

export default useUser; 