'use client';

import { SignUpButton } from '@/components/auth-buttons';

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Criar Conta</h1>
          <p className="text-muted-foreground">
            Crie sua conta para acessar o Robo-ETF
          </p>
        </div>
        
        <SignUpButton mode="redirect">
          Cadastrar
        </SignUpButton>
        
        <div className="text-center text-sm">
          Já tem uma conta?{' '}
          <a href="/sign-in" className="text-primary hover:underline">
            Entrar
          </a>
        </div>
      </div>
    </div>
  );
} 