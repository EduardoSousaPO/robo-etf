'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

export default function AccountPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Função para iniciar o processo de assinatura
  const handleSubscribe = async () => {
    try {
      setLoading(true);
      
      // Chamar API para criar assinatura
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'usuario@exemplo.com', // Na implementação real, seria obtido do Clerk
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao processar assinatura');
      }
      
      const data = await response.json();
      
      // Redirecionar para página de pagamento do Mercado Pago
      window.location.href = data.init_point;
    } catch (error) {
      console.error('Erro ao iniciar assinatura:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível processar sua assinatura. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Função para cancelar assinatura
  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      
      // Chamar API para cancelar assinatura
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao cancelar assinatura');
      }
      
      toast({
        title: 'Assinatura cancelada',
        description: 'Sua assinatura foi cancelada com sucesso.',
      });
      
      // Recarregar a página após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar sua assinatura. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Minha Conta</h1>
      
      <Tabs defaultValue="subscription">
        <TabsList>
          <TabsTrigger value="subscription">Assinatura</TabsTrigger>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscription" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Plano Atual</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Simulação: usuário com plano gratuito */}
              <div className="mb-6">
                <h3 className="mb-2 text-lg font-semibold">Plano Gratuito</h3>
                <p className="mb-4 text-muted-foreground">
                  Você está utilizando o plano gratuito com recursos limitados.
                </p>
                <ul className="mb-6 space-y-2">
                  <li className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-5 w-5 text-green-500"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    1 carteira de ETFs
                  </li>
                  <li className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-5 w-5 text-green-500"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Exportação CSV
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-5 w-5"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Sem rebalanceamento
                  </li>
                  <li className="flex items-center text-muted-foreground">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-5 w-5"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Sem relatório PDF
                  </li>
                </ul>
                <Button onClick={handleSubscribe} disabled={loading}>
                  {loading ? 'Processando...' : 'Fazer Upgrade para Premium'}
                </Button>
              </div>
              
              {/* Simulação: usuário com plano premium (comentado) */}
              {/* 
              <div className="mb-6">
                <h3 className="mb-2 text-lg font-semibold">Plano Premium</h3>
                <p className="mb-1 text-muted-foreground">
                  Assinatura ativa desde 01/01/2025
                </p>
                <p className="mb-4 text-muted-foreground">
                  Próxima cobrança: R$ 49,00 em 01/05/2025
                </p>
                <ul className="mb-6 space-y-2">
                  <li className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-5 w-5 text-green-500"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Carteiras ilimitadas
                  </li>
                  <li className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-5 w-5 text-green-500"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Exportação CSV e PDF
                  </li>
                  <li className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-5 w-5 text-green-500"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Alertas de rebalanceamento
                  </li>
                  <li className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-2 h-5 w-5 text-green-500"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Suporte prioritário
                  </li>
                </ul>
                <Button variant="outline" onClick={handleCancelSubscription} disabled={loading}>
                  {loading ? 'Processando...' : 'Cancelar Assinatura'}
                </Button>
              </div>
              */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gerencie suas informações pessoais e preferências de conta.
              </p>
              <p className="mt-4">
                Esta seção seria integrada com o Clerk para gerenciamento de perfil.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
