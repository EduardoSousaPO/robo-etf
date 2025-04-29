import Link from 'next/link';
import { UserButton } from '@/components/user-button';
import { currentUser } from '@clerk/nextjs/server';

export async function Navbar() {
  // Obter o usuário atual do Clerk
  const user = await currentUser();

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-slate-900">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold">
          Robo-ETF
        </Link>

        <nav className="hidden items-center space-x-6 md:flex">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            Início
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Dashboard
              </Link>
              <Link
                href="/portfolio"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Carteiras
              </Link>
            </>
          ) : (
            <Link
              href="/onboarding"
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Como Funciona
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <UserButton />
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/sign-in"
                className="rounded px-4 py-2 text-blue-600 hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-800"
              >
                Entrar
              </Link>

              <Link
                href="/sign-up"
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Cadastrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
