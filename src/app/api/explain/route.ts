import { NextRequest, NextResponse } from 'next/server';
import { explainAllocation } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { portfolio, riskScore } = await req.json();
    
    if (!portfolio || !riskScore) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }
    
    // Gerar explicação da carteira usando OpenAI
    const explanation = await explainAllocation(portfolio, riskScore);
    
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Erro ao gerar explicação:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar explicação da carteira' },
      { status: 500 }
    );
  }
}
