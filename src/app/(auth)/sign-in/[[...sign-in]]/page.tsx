'use client';

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-card p-6 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Entrar</h1>
          <p className="text-muted-foreground">Acesse sua conta do Robo-ETF</p>
        </div>

        <SignIn redirectUrl="/dashboard" />

        <div className="text-center text-sm">
          Não tem uma conta?{' '}
          <Link href="/sign-up" className="text-primary hover:underline">
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
