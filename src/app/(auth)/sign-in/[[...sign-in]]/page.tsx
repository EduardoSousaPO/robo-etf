'use client';

import { SignInButton } from '@/components/auth-buttons';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Entrar</h1>
          <p className="text-muted-foreground">
            Acesse sua conta do Robo-ETF
          </p>
        </div>
        
        <SignInButton mode="redirect">
          Entrar
        </SignInButton>
        
        <div className="text-center text-sm">
          Não tem uma conta?{' '}
          <a href="/sign-up" className="text-primary hover:underline">
            Criar conta
          </a>
        </div>
      </div>
    </div>
  );
} 