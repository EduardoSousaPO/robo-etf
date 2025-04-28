'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/constants';

interface AuthButtonProps {
  children: React.ReactNode;
  mode?: 'modal' | 'redirect';
  redirectUrl?: string;
}

// Verificar se as variáveis do Supabase estão disponíveis
const hasSupabaseConfig = SUPABASE_URL && SUPABASE_ANON_KEY;

export function SignInButton({ children, mode = 'modal', redirectUrl = '/dashboard' }: AuthButtonProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      if (hasSupabaseConfig) {
        const supabaseClient = createClientComponentClient();
        setSupabase(supabaseClient);
      } else {
        console.warn('Variáveis de ambiente do Supabase não configuradas. Autenticação desativada no componente SignInButton.');
        setError('Configuração de autenticação não está disponível no momento. Por favor, tente novamente mais tarde.');
      }
    } catch (err) {
      console.error('Erro ao inicializar cliente Supabase em SignInButton:', err);
      setError('Erro ao conectar com o serviço de autenticação. Por favor, tente novamente mais tarde.');
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!supabase) {
      setError('O serviço de autenticação não está disponível no momento. Por favor, tente novamente mais tarde.');
      setIsLoading(false);
      return;
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      setIsOpen(false);
      router.refresh();
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'redirect') {
    return (
      <Button 
        onClick={() => router.push('/sign-in')}
        variant="outline"
      >
        {children}
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Entrar na sua conta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSignIn} className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isLoading || !supabase}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SignUpButton({ children, mode = 'modal', redirectUrl = '/dashboard' }: AuthButtonProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabase, setSupabase] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      if (hasSupabaseConfig) {
        const supabaseClient = createClientComponentClient();
        setSupabase(supabaseClient);
      } else {
        console.warn('Variáveis de ambiente do Supabase não configuradas. Autenticação desativada no componente SignUpButton.');
        setError('Configuração de autenticação não está disponível no momento. Por favor, tente novamente mais tarde.');
      }
    } catch (err) {
      console.error('Erro ao inicializar cliente Supabase em SignUpButton:', err);
      setError('Erro ao conectar com o serviço de autenticação. Por favor, tente novamente mais tarde.');
    }
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!supabase) {
      setError('O serviço de autenticação não está disponível no momento. Por favor, tente novamente mais tarde.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      setIsOpen(false);
      router.refresh();
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === 'redirect') {
    return (
      <Button 
        onClick={() => router.push('/sign-up')}
      >
        {children}
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar conta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSignUp} className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Senha</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua senha"
              required
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isLoading || !supabase}>
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 