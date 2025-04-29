
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MarketOverviewProps {
  region: 'global' | 'us' | 'br' | 'eu' | 'asia';
}

// Dados simulados para demonstração
const mockData = {
  performance: [
    { name: 'Tecnologia', value: 15.5 },
    { name: 'Saúde', value: 12.1 },
    { name: 'Financeiro', value: 8.9 },
    { name: 'Consumo', value: 7.2 },
    { name: 'Industrial', value: 6.5 },
  ],
  flows: [
    { name: 'Renda Variável EUA', value: 500 },
    { name: 'Renda Fixa Global', value: 350 },
    { name: 'Mercados Emergentes', value: -150 },
    { name: 'Commodities', value: 200 },
    { name: 'Setor Tecnológico', value: 450 },
  ],
  sectors: [
    { name: 'Tecnologia', value: 28.5 },
    { name: 'Financeiro', value: 15.2 },
    { name: 'Saúde', value: 14.8 },
    { name: 'Consumo Discricionário', value: 12.1 },
    { name: 'Comunicações', value: 9.8 },
    { name: 'Industrial', value: 8.5 },
    { name: 'Outros', value: 11.1 },
  ],
};

export function MarketOverview({ region }: MarketOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(mockData); // Usando mockData por enquanto

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // TODO: Implementar chamada à API real quando disponível
        // const response = await fetch(`/api/etf?region=${region}&view=overview`);
        // const result = await response.json();
        // setData(result);
        // Simulando delay da API
        await new Promise(resolve => setTimeout(resolve, 1000));
        setData(mockData); // Mantendo mockData por enquanto
      } catch (error) {
        console.error('Erro ao carregar visão geral do mercado:', error);
        setData(mockData); // Usar mock em caso de erro
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [region]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div>
      <Tabs defaultValue="performance">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="flows">Fluxos</TabsTrigger>
          <TabsTrigger value="sectors">Setores</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-4">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} unit="%" />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="flows" className="mt-4">
           <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.flows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} unit="M" />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="sectors" className="mt-4">
           <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.sectors} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} unit="%" />
              <YAxis dataKey="name" type="category" fontSize={12} tickLine={false} axisLine={false} width={150} />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
}

