import { NextRequest, NextResponse } from 'next/server';
import { getETFDetails } from '@/lib/etf-data';

export async function GET(
  req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol;
    
    if (!symbol) {
      return NextResponse.json({ error: 'Símbolo do ETF não fornecido' }, { status: 400 });
    }
    
    const etfDetails = await getETFDetails(symbol);
    
    if (!etfDetails) {
      return NextResponse.json({ error: 'ETF não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(etfDetails);
  } catch (error) {
    console.error(`Erro ao obter detalhes do ETF ${params.symbol}:`, error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
} 