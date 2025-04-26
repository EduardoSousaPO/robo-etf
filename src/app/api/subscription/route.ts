import { NextRequest, NextResponse } from 'next/server';
import { createSubscription } from '@/lib/mercadopago';
import { auth } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

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
    
    // Obter dados do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Erro ao obter perfil:', profileError);
      return NextResponse.json(
        { error: 'Erro ao obter dados do usuário' },
        { status: 500 }
      );
    }
    
    // Obter email do usuário (na implementação real, seria obtido do Clerk)
    const userEmail = req.headers.get('x-user-email') || 'usuario@exemplo.com';
    
    // Criar assinatura no Mercado Pago
    const subscription = await createSubscription(
      'Robo-ETF Premium',
      49.00, // R$ 49,00 por mês
      userEmail
    );
    
    // Atualizar perfil do usuário com ID da assinatura
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_id: subscription.id,
        subscription_status: subscription.status,
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Erro ao atualizar perfil:', updateError);
      // Continuar mesmo com erro, pois a assinatura já foi criada
    }
    
    return NextResponse.json({
      success: true,
      subscription_id: subscription.id,
      init_point: subscription.init_point,
    });
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    return NextResponse.json(
      { error: 'Erro ao processar assinatura' },
      { status: 500 }
    );
  }
}
