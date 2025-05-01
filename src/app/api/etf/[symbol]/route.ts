import { NextRequest, NextResponse } from 'next/server';
import { getETFHoldings, getHistoricalPrices } from '@/lib/yfinance-adapter';

export async function GET(
  req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol;
    console.log(`Buscando detalhes para ETF: ${symbol}`);

    // Buscar holdings do ETF
    const holdings = await getETFHoldings(symbol);
    
    // Buscar dados históricos dos últimos 365 dias
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const historical = await getHistoricalPrices(
      symbol, 
      oneYearAgo.toISOString().split('T')[0], 
      today.toISOString().split('T')[0]
    );

    // Construir objeto de resposta com dados básicos
    const response = {
      symbol,
      holdings,
      historicalData: historical,
      // Outros dados podem ser adicionados conforme necessário
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Erro ao buscar detalhes para ETF:`, error);
    return NextResponse.json(
      { error: `Erro ao buscar detalhes para ETF: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 