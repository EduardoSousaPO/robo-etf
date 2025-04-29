import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-client';

// Interfaces para tipagem dos dados do Mercado Pago
interface WebhookPayload {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: 'payment' | 'subscription' | string;
  user_id: string;
}

interface PaymentData {
  id: number;
  status: string;
  external_reference?: string;
  transaction_amount: number;
  date_created: string;
  payer: {
    email: string;
  };
}

interface SubscriptionData {
  id: string;
  status: string;
  payer_id: string;
  external_reference?: string;
  reason: string;
  date_created: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 ~ Webhook recebido');
    
    // Verificar assinatura do webhook (implementar se necessário)
    
    const payload: WebhookPayload = await request.json();
    console.log('🚀 ~ payload:', payload);
    
    if (payload.type === 'payment') {
      return await handlePaymentNotification(payload.data.id);
    } 
    else if (payload.type === 'subscription') {
      return await handleSubscriptionNotification(payload.data.id);
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json({ error: 'Erro ao processar webhook' }, { status: 500 });
  }
}

async function handlePaymentNotification(paymentId: string) {
  try {
    // Obter detalhes do pagamento da API do Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao obter detalhes do pagamento: ${response.statusText}`);
    }
    
    const paymentData: PaymentData = await response.json();
    console.log('🚀 ~ paymentData:', paymentData);
    
    // Processar pagamento aprovado
    if (paymentData.status === 'approved' && paymentData.external_reference) {
      const supabase = createServiceClient();
      
      // Atualizar status da assinatura do usuário no banco de dados
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('id', paymentData.external_reference);
        
      if (error) {
        console.error('Erro ao atualizar status da assinatura:', error);
      } else {
        console.log(`Assinatura atualizada para active para o usuário ${paymentData.external_reference}`);
      }
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao processar notificação de pagamento:', error);
    return NextResponse.json({ error: 'Erro ao processar notificação de pagamento' }, { status: 500 });
  }
}

async function handleSubscriptionNotification(subscriptionId: string) {
  try {
    // Obter detalhes da assinatura da API do Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao obter detalhes da assinatura: ${response.statusText}`);
    }
    
    const subscriptionData: SubscriptionData = await response.json();
    console.log('🚀 ~ subscriptionData:', subscriptionData);
    
    // Processar mudança de status da assinatura
    if (subscriptionData.external_reference) {
      const supabase = createServiceClient();
      
      let newStatus = 'free';
      if (subscriptionData.status === 'authorized' || subscriptionData.status === 'active') {
        newStatus = 'active';
      }
      
      // Atualizar status da assinatura do usuário no banco de dados
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: newStatus })
        .eq('id', subscriptionData.external_reference);
        
      if (error) {
        console.error('Erro ao atualizar status da assinatura:', error);
      } else {
        console.log(`Assinatura atualizada para ${newStatus} para o usuário ${subscriptionData.external_reference}`);
      }
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro ao processar notificação de assinatura:', error);
    return NextResponse.json({ error: 'Erro ao processar notificação de assinatura' }, { status: 500 });
  }
}
