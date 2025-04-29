import { NextRequest, NextResponse } from 'next/server';
import Mercadopago from 'mercadopago';
import { verifyUserToken } from '@/lib/auth';
import { getProfileById, createOrUpdateProfile } from '@/lib/supabase';

// Configure o cliente Mercado Pago
Mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN || 'TEST-4180894767703290-052416-62b0f4ca4c6c3cad88b08bd3a43d36f8-1595653868'
});

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
    
    // Buscar dados do perfil do usuário
    const profile = await getProfileById(userId);
    if (!profile) {
      return NextResponse.json({ error: 'Perfil de usuário não encontrado' }, { status: 404 });
    }
    
    // Criar uma assinatura no Mercado Pago
    const preference = {
      payer_email: user.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 29.90,
        currency_id: "BRL"
      },
      back_urls: {
        success: `${request.nextUrl.origin}/dashboard`,
        failure: `${request.nextUrl.origin}/subscription-failed`,
      },
      notification_url: `${request.nextUrl.origin}/api/mercadopago/webhook`,
      metadata: {
        user_id: userId,
      }
    };
    
    const response = await Mercadopago.preapproval.create(preference);
    
    // Atualizar o perfil do usuário com a ID da assinatura
    await createOrUpdateProfile({
      id: userId,
      subscription_id: response.body.id,
      subscription_status: 'premium'
    });
    
    return NextResponse.json({
      success: true,
      subscription: {
        id: response.body.id,
        init_point: response.body.init_point,
      }
    });
    
  } catch (error: any) {
    console.error('Erro ao criar assinatura:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
