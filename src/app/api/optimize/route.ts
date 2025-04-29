import { optimizePortfolio } from '@/lib/optim';
import { getLiquidETFs } from '@/lib/api-adapter';
import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken } from '@/lib/auth';

interface OptimizeRequest {
  riskScore: number;
}

export async function POST(request: NextRequest) {
  try {
    // Extrair o token do cabeçalho de autorização
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autenticação inválido' }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verificar a autenticação do usuário
    const user = await verifyUserToken(token);
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado. Faça login para continuar.' }, { status: 401 });
    }
    
    const data = await request.json() as OptimizeRequest;
    const { riskScore } = data;
    
    if (!riskScore || riskScore < 1 || riskScore > 5) {
      return NextResponse.json(
        { error: 'Perfil de risco inválido. Deve ser um número entre 1 e 5.' },
        { status: 400 }
      );
    }
    
    // Obter ETFs líquidos com tratamento de erro
    let liquidETFs;
    try {
      liquidETFs = await getLiquidETFs();
      if (!liquidETFs || liquidETFs.length === 0) {
        throw new Error('Não foi possível obter ETFs líquidos');
      }
    } catch (error) {
      console.error('Erro ao obter ETFs líquidos:', error);
      return NextResponse.json(
        { error: 'Erro ao obter dados de ETFs. Por favor, tente novamente mais tarde.' },
        { status: 500 }
      );
    }
    
    const etfSymbols = liquidETFs.map(etf => etf.symbol);
    
    // Definir período para análise (5 anos)
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date(
      new Date().setFullYear(new Date().getFullYear() - 5)
    ).toISOString().split('T')[0];
    
    // Executar otimização com tratamento de erro
    let result;
    try {
      result = await optimizePortfolio(etfSymbols, riskScore, fromDate, toDate);
    } catch (error) {
      console.error('Erro na otimização:', error);
      return NextResponse.json(
        { error: 'Erro ao processar a otimização da carteira. Por favor, tente novamente.' },
        { status: 500 }
      );
    }
    
    // Adicionar data de rebalanceamento (6 meses a partir de hoje)
    const rebalanceDate = new Date();
    rebalanceDate.setMonth(rebalanceDate.getMonth() + 6);
    
    return NextResponse.json({
      ...result,
      rebalance_date: rebalanceDate.toISOString().split('T')[0]
    });
  } catch (error: any) {
    console.error('Erro na otimização:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar a otimização da carteira.' },
      { status: 500 }
    );
  }
}
