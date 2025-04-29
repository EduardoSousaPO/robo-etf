'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserButton } from '@/components/user-button';
import { useAuth } from '@/lib/hooks/useAuth';

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState('what');
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Como Funciona o Robo-ETF</h1>
        {user ? (
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
            <UserButton user={user} />
          </div>
        ) : (
          <Button onClick={() => router.push('/sign-up')}>
            Criar Conta
          </Button>
        )}
      </div>

      <Tabs defaultValue="what" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="what">O Que É</TabsTrigger>
          <TabsTrigger value="how">Como Funciona</TabsTrigger>
          <TabsTrigger value="why">Por Que Usar</TabsTrigger>
        </TabsList>
        <TabsContent value="what" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>O Que é o Robo-ETF?</CardTitle>
              <CardDescription>
                Uma solução para investir globalmente com eficiência e baixo custo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                O Robo-ETF é uma plataforma que utiliza <strong>algoritmos avançados</strong> para criar carteiras de ETFs globais personalizadas, alinhadas com seu perfil de risco e objetivos financeiros.
              </p>
              <p>
                Através de ETFs (Exchange Traded Funds), você investe em:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mercados de ações globais (EUA, Europa, Ásia, Emergentes)</li>
                <li>Renda fixa internacional</li>
                <li>Commodities e metais preciosos</li>
                <li>Setores específicos (Tecnologia, Saúde, Finanças, etc.)</li>
              </ul>
              <p>
                Nossa tecnologia seleciona os melhores ETFs e determina a alocação ideal para atingir o máximo retorno possível para seu nível de risco.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setActiveTab('how')} className="w-full">
                Próximo: Como Funciona
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="how" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Como Funciona o Robo-ETF</CardTitle>
              <CardDescription>
                Um processo simples em apenas 3 passos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">1. Defina seu Perfil de Risco</h3>
                <p>
                  Responda algumas perguntas sobre seus objetivos financeiros, horizonte de investimento e tolerância a risco. Nosso algoritmo calculará seu perfil ideal.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">2. Receba sua Carteira Personalizada</h3>
                <p>
                  Com base no seu perfil, nosso algoritmo criará uma carteira diversificada de ETFs otimizada para maximizar retornos e minimizar riscos.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">3. Implemente e Acompanhe</h3>
                <p>
                  Siga as recomendações em sua corretora e acompanhe o desempenho da sua carteira. Quando necessário, sugerimos rebalanceamentos para manter a estratégia alinhada.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setActiveTab('why')} className="w-full">
                Próximo: Por Que Usar
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="why" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Por Que Usar o Robo-ETF</CardTitle>
              <CardDescription>
                Benefícios para sua estratégia de investimentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Diversificação Global</h3>
                  <p>
                    Acesso a mercados internacionais que podem oferecer retornos quando o mercado brasileiro está em baixa.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Baixo Custo</h3>
                  <p>
                    ETFs têm taxas significativamente menores que fundos ativos, preservando mais do seu capital para crescimento.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Eficiência Tributária</h3>
                  <p>
                    Estratégias otimizadas para minimizar impactos fiscais e maximizar retornos líquidos.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Baseado em Ciência</h3>
                  <p>
                    Utiliza Teoria Moderna de Portfólio e décadas de pesquisa acadêmica para otimização de carteiras.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push('/sign-up')} className="w-full">
                Começar Agora
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

