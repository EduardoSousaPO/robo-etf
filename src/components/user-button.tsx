'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User } from '@supabase/auth-helpers-nextjs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/hooks/useAuth';

interface UserButtonProps {
  user: User;
}

export function UserButton({ user }: UserButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signOut } = useAuth();

  // Obter iniciais do email do usuário para o avatar
  const getInitials = (email: string) => {
    return email?.substring(0, 2).toUpperCase() || 'U';
  };

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative rounded-full h-8 w-8 p-0">
          <Avatar>
            <AvatarFallback>{getInitials(user.email || '')}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
        <DropdownMenuLabel className="font-normal text-xs truncate max-w-[200px]">
          {user.email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          Perfil
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={isLoading}
          className="text-red-500 focus:text-red-500"
        >
          {isLoading ? 'Saindo...' : 'Sair'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 