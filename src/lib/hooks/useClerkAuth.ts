import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function useClerkAuth() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Função para fazer logout
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      // Lógica de navegação após o logout
      router.refresh();
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoaded,
    isLoading,
    signOut: handleSignOut,
  };
}
