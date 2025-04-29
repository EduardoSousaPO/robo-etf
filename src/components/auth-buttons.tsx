'use client';

import { useState } from 'react';
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
import { signIn, signUp } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface AuthButtonProps {
  children: React.ReactNode;
  mode?: 'modal' | 'redirect';
  redirectUrl?: string;
}

// Interfaces para o retorno da API Supabase
interface UserData {
  user?: {
    id: string;
    email?: string;
    identities?: { id: string; provider: string }[];
  } | null;
  session?: unknown;
}

const AuthError = ({ message }: { message: string | null }) => {
  if (!message) return null;
  
  return (
    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md">
      {message}
    </div>
  );
};

const LoadingButton = ({ children, isLoading }: { children: React.ReactNode, isLoading: boolean }) => (
  <Button type="submit" disabled={isLoading}>
    {isLoading ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span>Processando...</span>
      </>
    ) : (
      children
    )}
  </Button>
);

export function SignInButton({ children, mode = 'modal', redirectUrl = '/dashboard' }: AuthButtonProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      setIsLoading(false);
      return;
    }

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha inválidos');
        }
        throw signInError;
      }

      setIsOpen(false);
      router.refresh();
      router.push(redirectUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(errorMessage);
      console.error('Erro de autenticação:', err);
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
          <AuthError message={error} />
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              disabled={isLoading}
              className="focus:ring-2 focus:ring-blue-500"
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
              disabled={isLoading}
              className="focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <DialogFooter className="pt-4">
            <LoadingButton isLoading={isLoading}>
              Entrar
            </LoadingButton>
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
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    if (!email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    try {
      const { error: signUpError, data } = await signUp(email, password);
      const userData = data as UserData | null;

      if (signUpError) {
        const authError = signUpError as Error;
        if (authError.message?.includes('already')) {
          throw new Error('Este email já está em uso');
        }
        if (authError.message?.includes('Database error saving new user')) {
          throw new Error('Erro ao salvar usuário no banco de dados. Por favor, tente novamente mais tarde ou contate o suporte.');
        }
        throw signUpError;
      }

      if (userData?.user?.identities?.length === 0) {
        setSuccess(true);
        return;
      }

      setIsOpen(false);
      router.refresh();
      router.push(redirectUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar conta';
      setError(errorMessage);
      console.error('Erro de cadastro:', err);
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
        
        {success ? (
          <div className="py-6">
            <div className="p-4 bg-green-50 text-green-600 rounded-md mb-4">
              <h3 className="font-semibold mb-2">Cadastro realizado com sucesso!</h3>
              <p>Enviamos um email de confirmação para <strong>{email}</strong>.</p>
              <p className="mt-2">Por favor, verifique sua caixa de entrada e clique no link de confirmação.</p>
            </div>
            <Button onClick={() => setIsOpen(false)} className="w-full">
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4 py-4">
            <AuthError message={error} />
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={isLoading}
                className="focus:ring-2 focus:ring-blue-500"
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
                disabled={isLoading}
                className="focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">A senha deve ter pelo menos 6 caracteres</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme sua senha"
                required
                disabled={isLoading}
                className="focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <DialogFooter className="pt-4">
              <LoadingButton isLoading={isLoading}>
                Criar conta
              </LoadingButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 