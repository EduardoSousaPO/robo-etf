import { UserButton } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const user = await currentUser();
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Painel do Usuário</h1>
        <UserButton />
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Bem-vindo, {user?.firstName || 'Usuário'}!</h2>
        <p className="mb-4">Aqui você pode gerenciar suas carteiras de ETFs e configurações de perfil.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium mb-2">Criar Nova Carteira</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Configure uma nova carteira baseada no seu perfil de risco
            </p>
            <a href="/portfolio/new" className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2">
              Começar
            </a>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium mb-2">Minhas Carteiras</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Visualize e gerencie suas carteiras existentes
            </p>
            <a href="/portfolio" className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white px-4 py-2">
              Ver Carteiras
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 