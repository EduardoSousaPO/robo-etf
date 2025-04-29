
'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface ETFTableProps {
  category?: string;
  region?: string;
  limit?: number;
  filter?: Record<string, any>;
}

export function ETFTable({ category = 'all', region = 'global', limit = 10, filter = {} }: ETFTableProps) {
  const [loading, setLoading] = useState(true);
  const [etfs, setEtfs] = useState<any[]>([]);

  useEffect(() => {
    async function fetchETFs() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          category,
          region,
          limit: limit.toString(),
          ...filter
        });

        const response = await fetch(`/api/etf?${queryParams}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEtfs(data);
      } catch (error) {
        console.error('Erro ao carregar ETFs:', error);
        setEtfs([]); // Limpar ETFs em caso de erro
      } finally {
        setLoading(false);
      }
    }

    fetchETFs();
  }, [category, region, limit, JSON.stringify(filter)]); // Adicionar filter ao array de dependências

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        {Array(limit > 5 ? 5 : limit).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (etfs.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400">Nenhum ETF encontrado.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Símbolo</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead className="text-right">Preço</TableHead>
          <TableHead className="text-right">Variação (1D)</TableHead>
          <TableHead className="text-right">Volume</TableHead>
          <TableHead>Categoria</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {etfs.map((etf) => (
          <TableRow key={etf.symbol}>
            <TableCell className="font-medium">
              {/* TODO: Implementar página de detalhes do ETF em /dashboard/[symbol] */}
              {/* <Link href={`/dashboard/${etf.symbol}`} className="text-blue-600 hover:underline"> */}
                {etf.symbol}
              {/* </Link> */}
            </TableCell>
            <TableCell className="max-w-xs truncate" title={etf.name}>{etf.name}</TableCell>
            <TableCell className="text-right">${etf.price?.toFixed(2) ?? 'N/A'}</TableCell>
            <TableCell className={`text-right ${etf.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {etf.change >= 0 ? '+' : ''}{etf.change?.toFixed(2) ?? 'N/A'}%
            </TableCell>
            <TableCell className="text-right">{(etf.volume / 1000000).toFixed(1)}M</TableCell>
            <TableCell>
              <Badge variant="secondary">{etf.category}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

