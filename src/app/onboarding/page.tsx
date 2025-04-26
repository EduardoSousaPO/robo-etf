import { UserButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';

export default async function OnboardingPage() {
  const user = await currentUser();
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Bem-vindo ao Robo-ETF!</h1>
        <UserButton />
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8">
        <h2 className="text-2xl font-semibold mb-6">Vamos começar, {user?.firstName || 'Investidor'}!</h2>
        
        <div className="space-y-6">
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h3 className="font-medium text-lg mb-2">Etapa 1: Complete seu perfil de investidor</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Responda um breve questionário para determinarmos seu perfil de risco e objetivos de investimento.
            </p>
          </div>
          
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h3 className="font-medium text-lg mb-2">Etapa 2: Crie sua primeira carteira</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Com base no seu perfil, nosso algoritmo gerará uma carteira global de ETFs otimizada para seus objetivos.
            </p>
          </div>
          
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h3 className="font-medium text-lg mb-2">Etapa 3: Acompanhe seu desempenho</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Monitore o desempenho da sua carteira e receba alertas para rebalanceamento quando necessário.
            </p>
          </div>
        </div>
        
        <div className="mt-10 flex justify-center">
          <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium text-lg">
            Ir para o Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
