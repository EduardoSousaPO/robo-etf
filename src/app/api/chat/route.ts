import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensagem inválida' }, { status: 400 });
    }
    
    // Gerar resposta usando OpenAI
    const response = await generateChatResponse(message);
    
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Erro na API de chat:', error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
}
