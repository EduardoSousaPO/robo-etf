"use client";

import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { AlertTriangle } from "lucide-react"; // Import icon for error state

interface ETFTableProps {
  category?: string;
  region?: string;
  limit?: number;
  filter?: Record<string, any>;
}

// Componente para exibir estado de erro
function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 rounded-md border border-dashed border-destructive p-6 text-center text-destructive">
      <AlertTriangle className="h-8 w-8" />
      <p className="text-sm font-medium">Erro ao Carregar ETFs</p>
      <p className="text-xs text-muted-foreground">{message}</p>
      <button 
        onClick={onRetry}
        className="mt-2 rounded-md bg-primary px-4 py-2 text-xs text-white hover:bg-primary/90"
      >
        Tentar Novamente
      </button>
    </div>
  );
}

// Componente para exibir estado vazio
function EmptyDisplay() {
  return (
    <div className="flex flex-col items-center justify-center space-y-2 rounded-md border border-dashed p-6 text-center text-muted-foreground">
      <p className="text-sm font-medium">Nenhum ETF Encontrado</p>
      <p className="text-xs">Tente ajustar os filtros ou verificar mais tarde.</p>
    </div>
  );
}

export function ETFTable({ category = "all", region = "global", limit = 10, filter = {} }: ETFTableProps) {
  const [loading, setLoading] = useState(true);
  const [etfs, setEtfs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function fetchETFs() {
    setLoading(true);
    setError(null); // Reset error on new fetch
    setEtfs([]); // Reset etfs on new fetch
    try {
      console.log(`Buscando ETFs: categoria=${category}, região=${region}, limite=${limit}`);
      
      const queryParams = new URLSearchParams({
        category,
        region,
        limit: limit.toString(),
        // Add filter properties individually to avoid issues with object serialization
        ...(filter.assetClass && { assetClass: filter.assetClass }),
        ...(filter.expenseRatioMax && { expenseRatioMax: filter.expenseRatioMax.toString() }),
        ...(filter.aumMin && { aumMin: filter.aumMin.toString() }),
      });

      // Remove empty parameters
      queryParams.forEach((value, key) => {
        if (!value) {
          queryParams.delete(key);
        }
      });

      console.log(`Fazendo requisição para /api/etf?${queryParams}`);
      const response = await fetch(`/api/etf?${queryParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      console.log(`Status da resposta: ${response.status}`);
      
      if (!response.ok) {
        let errorMessage = `Falha ao buscar ETFs: ${response.statusText}`;
        try {
          const errorData = await response.json() as { error?: string };
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error("Erro ao analisar resposta de erro:", parseError);
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json() as any[];
      console.log(`Dados recebidos: ${data.length} ETFs`);
      setEtfs(data);
    } catch (err: any) {
      console.error("Erro ao carregar ETFs:", err);
      setError(err.message || "Ocorreu um erro inesperado ao buscar os ETFs.");
      setEtfs([]); // Ensure etfs is empty on error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchETFs();
    // Use JSON.stringify(filter) to ensure effect runs when filter object changes
  }, [category, region, limit, JSON.stringify(filter)]);

  if (loading) {
    return (
      <div className="space-y-2 overflow-hidden rounded-md border">
        {/* Skeleton matching table structure */}
        <Skeleton className="h-12 w-full" /> {/* Header */}
        {Array(limit > 5 ? 5 : limit)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex h-14 items-center space-x-4 px-4">
              <Skeleton className="h-6 w-1/6" />
              <Skeleton className="h-6 w-2/6" />
              <Skeleton className="h-6 w-1/6" />
              <Skeleton className="h-6 w-1/6" />
              <Skeleton className="h-6 w-1/6" />
            </div>
          ))}
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchETFs} />;
  }

  if (etfs.length === 0) {
    return <EmptyDisplay />;
  }

  return (
    <div className="overflow-hidden rounded-md border">
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
                {/* TODO: Implementar página de detalhes do ETF em /dashboard/etf/[symbol] */}
                {/* <Link href={`/dashboard/etf/${etf.symbol}`} className="text-blue-600 hover:underline"> */}
                {etf.symbol}
                {/* </Link> */}
              </TableCell>
              <TableCell className="max-w-xs truncate" title={etf.name}>{etf.name}</TableCell>
              <TableCell className="text-right">${etf.price?.toFixed(2) ?? "N/A"}</TableCell>
              <TableCell className={`text-right ${etf.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                {etf.change >= 0 ? "+" : ""}{etf.change?.toFixed(2) ?? "N/A"}%
              </TableCell>
              <TableCell className="text-right">
                {etf.volume ? `${(etf.volume / 1000000).toFixed(1)}M` : "N/A"}
              </TableCell>
              <TableCell>
                {etf.category && <Badge variant="secondary">{etf.category}</Badge>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

