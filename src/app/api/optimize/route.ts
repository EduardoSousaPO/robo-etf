import { optimizePortfolio } from '@/lib/optim';
import { getLiquidETFs } from '@/lib/api-adapter';
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server'; // Use Clerk server-side auth
import { createPortfolio, getProfileById } from '@/lib/repository'; // Use Prisma repository
import { Portfolio } from '@prisma/client'; // Import Prisma types

interface OptimizeRequest {
  riskScore: number;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar a autenticação do usuário usando Clerk
    const { userId } = getAuth(request);

    if (!userId) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }

    // Buscar perfil para garantir que o usuário existe (opcional, mas bom)
    const profile = await getProfileById(userId);
    if (!profile) {
      console.error(`Perfil não encontrado para o usuário ${userId} ao otimizar carteira.`);
      // Considerar criar o perfil aqui se ele não existir, ou garantir que seja criado no login/onboarding
      return NextResponse.json({ error: 'Perfil de usuário não encontrado' }, { status: 404 });
    }

    const data = await request.json() as OptimizeRequest;
    // Usar o riskScore do perfil do usuário como fallback ou validação?
    // Por enquanto, usamos o enviado na requisição, mas validamos.
    const { riskScore } = data;

    if (typeof riskScore !== 'number' || riskScore < 1 || riskScore > 5) {
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
        { status: 503 } // Service Unavailable
      );
    }

    const etfSymbols = liquidETFs.map(etf => etf.symbol);

    // Definir período para análise (5 anos)
    const toDate = new Date();
    const fromDate = new Date(new Date().setFullYear(toDate.getFullYear() - 5));

    // Executar otimização com tratamento de erro
    let optimizationResult;
    try {
      optimizationResult = await optimizePortfolio(
        etfSymbols,
        riskScore,
        fromDate.toISOString().split('T')[0],
        toDate.toISOString().split('T')[0]
      );
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

    // Preparar dados para salvar no banco
    const portfolioDataToSave: Omit<Portfolio, 'id' | 'created_at'> = {
      user_id: userId,
      weights: optimizationResult.weights, // Prisma espera Json
      metrics: {
        // Mapear nomes para corresponder ao schema Prisma (Json)
        expectedReturn: optimizationResult.expectedReturn,
        risk: optimizationResult.risk,
        sharpeRatio: optimizationResult.sharpeRatio,
      },
      rebalance_date: rebalanceDate,
    };

    // Salvar a carteira otimizada no banco de dados usando Prisma
    let savedPortfolio;
    try {
      savedPortfolio = await createPortfolio(portfolioDataToSave);
    } catch (dbError) {
      console.error('Erro ao salvar a carteira otimizada no banco de dados:', dbError);
      // Retornar o resultado da otimização mesmo se salvar falhar?
      // Ou retornar erro 500?
      // Por enquanto, retornamos erro 500, pois salvar é parte do fluxo esperado.
      return NextResponse.json(
        { error: 'Erro ao salvar a carteira gerada. Por favor, tente novamente.' },
        { status: 500 }
      );
    }

    // Retornar a carteira salva (que inclui id, created_at, etc.)
    return NextResponse.json(savedPortfolio);

  } catch (error: any) {
    console.error('Erro inesperado na API de otimização:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor ao processar a otimização.' },
      { status: 500 }
    );
  }
}

