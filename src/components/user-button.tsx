'use client';

import { useClerkAuth } from '@/lib/hooks/useClerkAuth';
import { UserButton as ClerkUserButton } from '@clerk/nextjs';

export function UserButton() {
  const { user, isLoaded } = useClerkAuth();

  // Se o componente ainda não carregou, mostrar um espaço reservado
  if (!isLoaded) {
    return <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>;
  }

  // Se não houver usuário logado, não mostrar o botão
  if (!user) {
    return null;
  }

  // Usar o botão personalizado do Clerk
  return (
    <ClerkUserButton
      afterSignOutUrl="/"
      appearance={{
        elements: {
          userButtonAvatarBox: 'h-8 w-8',
        },
      }}
    />
  );
}
