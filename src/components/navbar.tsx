import Link from 'next/link';
import { createServerClient } from '@/lib/supabase-server';
import { UserButton } from '@/components/user-button';
import { SignInButton, SignUpButton } from './auth-buttons';

export async function Navbar() {
  // Inicializar usuário como null por padrão
  let user = null;
  
  try {
    // Criar cliente Supabase para servidor
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user;
  } catch (error) {
    console.error('Erro ao verificar autenticação na Navbar:', error);
  }
  
  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl">
          Robo-ETF
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            Início
          </Link>
          
          {user ? (
            <>
              <Link href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Dashboard
              </Link>
              <Link href="/portfolio" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Carteiras
              </Link>
            </>
          ) : (
            <Link href="/onboarding" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              Como Funciona
            </Link>
          )}
        </nav>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <UserButton user={user} />
          ) : (
            <div className="flex items-center space-x-2">
              <SignInButton mode="modal">
                <button className="px-4 py-2 rounded text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                  Entrar
                </button>
              </SignInButton>
              
              <SignUpButton mode="modal">
                <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                  Cadastrar
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 