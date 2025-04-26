import { NextRequest, NextResponse } from 'next/server';
import { generatePortfolioPDF } from '@/lib/pdf-generator';
import { supabase } from '@/lib/supabase';
import { auth } from '@clerk/nextjs';

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Obter dados da carteira
    const { portfolio, riskScore, explanation } = await req.json();
    
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
    
    // Salvar no Supabase Storage
    const { data, error } = await supabase
      .storage
      .from('portfolio-pdfs')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (error) {
      console.error('Erro ao salvar PDF:', error);
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
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar PDF' },
      { status: 500 }
    );
  }
}
