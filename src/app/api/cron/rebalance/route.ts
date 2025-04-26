import { NextRequest, NextResponse } from 'next/server';
import { checkPortfoliosForRebalance } from '@/lib/rebalance';

// Esta rota seria chamada pelo Vercel Scheduler em um ambiente de produção
export async function GET(req: NextRequest) {
  try {
    // Verificar chave de API para segurança (em produção, usaria uma chave secreta)
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Executar verificação de rebalanceamento
    const result = await checkPortfoliosForRebalance();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao executar cron de rebalanceamento:', error);
    return NextResponse.json(
      { error: 'Erro ao executar cron de rebalanceamento' },
      { status: 500 }
    );
  }
}
