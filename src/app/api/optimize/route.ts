import { optimizePortfolio } from '@/lib/optim';
import { getLiquidETFs } from '@/lib/fmp';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { riskScore } = await req.json();
    
    if (!riskScore || riskScore < 1 || riskScore > 5) {
      return NextResponse.json(
        { error: 'Perfil de risco inválido. Deve ser um número entre 1 e 5.' },
        { status: 400 }
      );
    }
    
    // Obter ETFs líquidos
    const liquidETFs = await getLiquidETFs();
    const etfSymbols = liquidETFs.map(etf => etf.symbol);
    
    // Definir período para análise (5 anos)
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date(
      new Date().setFullYear(new Date().getFullYear() - 5)
    ).toISOString().split('T')[0];
    
    // Executar otimização
    const result = await optimizePortfolio(etfSymbols, riskScore, fromDate, toDate);
    
    // Adicionar data de rebalanceamento (6 meses a partir de hoje)
    const rebalanceDate = new Date();
    rebalanceDate.setMonth(rebalanceDate.getMonth() + 6);
    
    return NextResponse.json({
      ...result,
      rebalance_date: rebalanceDate.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Erro na otimização:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a otimização da carteira.' },
      { status: 500 }
    );
  }
}
