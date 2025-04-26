'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Tipo para a carteira otimizada
type Portfolio = {
  weights: Record<string, number>;
  metrics: {
    expectedReturn: number;
    risk: number;
    sharpeRatio: number;
  };
  rebalance_date: string;
};

export default function PortfolioPage() {
  const searchParams = useSearchParams();
  const riskScore = searchParams.get('risk_score') || '3';
  
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [explanation, setExplanation] = useState('');
  
  // Buscar carteira otimizada
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/optimize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ riskScore: parseInt(riskScore) }),
        });
        
        if (!response.ok) {
          console.error(`Erro ao obter carteira otimizada: ${response.status}`);
          setError('Falha ao obter carteira otimizada. Por favor, tente novamente mais tarde.');
          return;
        }
        
        const data = await response.json();
        if (data && typeof data === 'object' && 'weights' in data && 'metrics' in data) {
          setPortfolio(data as Portfolio);
          
          // Simular explicação gerada por IA
          setExplanation(generateExplanation(data as Portfolio, parseInt(riskScore)));
        } else {
          setError('Dados inválidos recebidos do servidor.');
        }
      } catch (err) {
        setError('Erro ao carregar carteira. Por favor, tente novamente.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPortfolio();
  }, [riskScore]);
  
  // Função para exportar CSV
  const exportCSV = () => {
    if (!portfolio) return;
    
    const headers = ['ETF', 'Peso'];
    const rows = Object.entries(portfolio.weights).map(([symbol, weight]) => [
      symbol,
      (weight * 100).toFixed(2) + '%',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `roboetf_carteira_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };
  
  // Função para simular explicação gerada por IA
  const generateExplanation = (portfolio: Portfolio, riskScore: number) => {
    const riskProfiles = [
      'muito conservador',
      'conservador',
      'moderado',
      'arrojado',
      'muito arrojado',
    ];
    
    const profileName = riskProfiles[riskScore - 1];
    const topETFs = Object.entries(portfolio.weights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([symbol]) => symbol);
    
    return `Sua carteira foi otimizada para um perfil ${profileName}, com foco em ${
      riskScore <= 2 ? 'preservação de capital e menor volatilidade' : 
      riskScore === 3 ? 'equilíbrio entre risco e retorno' : 
      'crescimento e maior potencial de retorno'
    }.

Os ETFs com maior peso na sua carteira são ${topETFs.join(', ')}, selecionados por ${
      riskScore <= 2 ? 'seu histórico de estabilidade e menor correlação com mercados voláteis' : 
      riskScore === 3 ? 'seu equilíbrio entre crescimento e estabilidade' : 
      'seu potencial de crescimento e exposição a setores de alto desempenho'
    }.

${
  riskScore <= 2 ? 
  'Para otimização tributária, priorizamos ETFs domiciliados na Irlanda (sufixo -IE) que oferecem vantagens fiscais para investidores brasileiros.' : 
  'A carteira prioriza ETFs com maior liquidez e histórico consistente de desempenho.'
}

O retorno anualizado esperado é de ${(portfolio.metrics.expectedReturn * 100).toFixed(2)}%, com volatilidade de ${(portfolio.metrics.risk * 100).toFixed(2)}% e índice Sharpe de ${portfolio.metrics.sharpeRatio.toFixed(2)}.

Recomendamos revisar e rebalancear sua carteira em ${new Date(portfolio.rebalance_date).toLocaleDateString('pt-BR')}, ou antes caso ocorra uma queda superior a 15% no valor total.`;
  };
  
  // Renderizar estado de carregamento
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Sua Carteira Otimizada</h1>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[180px] w-full" />
          <Skeleton className="h-[180px] w-full" />
          <Skeleton className="h-[180px] w-full" />
        </div>
        <Skeleton className="mt-6 h-[400px] w-full" />
      </div>
    );
  }
  
  // Renderizar estado de erro
  if (error) {
    return (
      <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-destructive">Ops! Algo deu errado</h1>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
        </div>
      </div>
    );
  }
  
  // Renderizar carteira
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-2xl font-bold">Sua Carteira Otimizada</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}>
            Exportar CSV
          </Button>
          <Button variant="outline" onClick={() => setExplanationOpen(true)}>
            Explicação da Carteira
          </Button>
        </div>
      </div>
      
      {portfolio && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Retorno Esperado (anual)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(portfolio.metrics.expectedReturn * 100).toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Volatilidade (anual)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(portfolio.metrics.risk * 100).toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Índice Sharpe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolio.metrics.sharpeRatio.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="chart" className="mt-6">
            <TabsList>
              <TabsTrigger value="chart">Gráfico</TabsTrigger>
              <TabsTrigger value="table">Tabela</TabsTrigger>
            </TabsList>
            <TabsContent value="chart" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="aspect-[4/3] w-full">
                    {/* Aqui seria implementado o gráfico de pizza com Chart.js */}
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">
                        Gráfico de alocação da carteira (implementação com Chart.js)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="table" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left font-medium">ETF</th>
                          <th className="pb-2 text-right font-medium">Alocação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(portfolio.weights)
                          .sort(([, a], [, b]) => b - a)
                          .map(([symbol, weight]) => (
                            <tr key={symbol} className="border-b">
                              <td className="py-3">{symbol}</td>
                              <td className="py-3 text-right">
                                {(weight * 100).toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Próximo Rebalanceamento</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Recomendamos revisar e rebalancear sua carteira em{' '}
                <strong>
                  {new Date(portfolio.rebalance_date).toLocaleDateString('pt-BR')}
                </strong>
                , ou antes caso ocorra uma queda superior a 15% no valor total.
              </p>
            </CardContent>
          </Card>
          
          <Dialog open={explanationOpen} onOpenChange={setExplanationOpen}>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Explicação da Carteira</DialogTitle>
              </DialogHeader>
              <div className="mt-4 whitespace-pre-line">{explanation}</div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
