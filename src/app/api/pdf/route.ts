import { NextRequest, NextResponse } from 'next/server';
import { generatePortfolioPDF } from '@/lib/pdf-generator';
import { createClient } from '@supabase/supabase-js';
import { verifyUserToken } from '@/lib/auth';

// Função local para criar cliente de serviço do Supabase
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iikdiavzocnpspebjasp.supabase.co';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2RpYXZ6b2NucHNwZWJqYXNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTYxNzU3NCwiZXhwIjoyMDYxMTkzNTc0fQ.bwQZqwTpEvmFdVMzgNxPovEvCaTHInBoXEKfFTTquJg';
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Tipo para a carteira otimizada (copiado de pdf-generator.ts)
type Portfolio = {
  weights: Record<string, number>;
  metrics: {
    return: number;
    volatility: number;
    sharpe: number;
  };
  rebalance_date: string;
};

interface PDFRequest {
  portfolio: Portfolio;
  riskScore: number;
  explanation: string;
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
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }
    
    const userId = user.id;
    
    // Obter dados da carteira
    const { portfolio, riskScore, explanation } = await request.json() as PDFRequest;
    
    if (!portfolio || !riskScore || !explanation) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }
    
    // Gerar PDF
    const pdfBytes = await generatePortfolioPDF(portfolio, riskScore, explanation);
    
    // Nome do arquivo
    const fileName = `roboetf_carteira_${userId}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Criar cliente Supabase com chave de serviço
    const supabase = createServiceClient();
    
    // Salvar no Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('portfolio-pdfs')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Erro ao salvar PDF:', uploadError);
      return NextResponse.json(
        { error: 'Erro ao salvar PDF' },
        { status: 500 }
      );
    }
    
    // Obter URL pública
    const { data: urlData } = await supabase
      .storage
      .from('portfolio-pdfs')
      .getPublicUrl(fileName);
    
    return NextResponse.json({
      success: true,
      url: urlData.publicUrl
    });
  } catch (error: unknown) {
    console.error('Erro ao gerar PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar PDF';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
