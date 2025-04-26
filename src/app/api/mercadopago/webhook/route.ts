import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // Verificar assinatura do webhook (na implementação real, verificaria a assinatura)
    const signature = req.headers.get('x-signature');
    if (!signature) {
      console.warn('Webhook sem assinatura');
      // Em produção, retornaria erro 401
    }
    
    // Obter dados do webhook
    const data = await req.json();
    console.log('Webhook recebido:', JSON.stringify(data));
    
    // Processar diferentes tipos de notificação
    if (data.type === 'payment') {
      await handlePaymentNotification(data);
    } else if (data.type === 'subscription_preapproval') {
      await handleSubscriptionNotification(data);
    } else {
      console.log(`Tipo de notificação não tratado: ${data.type}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}

// Processar notificação de pagamento
async function handlePaymentNotification(data: any) {
  const paymentId = data.data.id;
  
  // Obter detalhes do pagamento
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao obter detalhes do pagamento: ${response.status}`);
  }
  
  const paymentData = await response.json();
  const { status, external_reference, transaction_amount } = paymentData;
  
  console.log(`Pagamento ${paymentId} com status ${status}`);
  
  // Atualizar status do pagamento no banco de dados
  // Na implementação real, atualizaria o status do pagamento e liberaria acesso premium
}

// Processar notificação de assinatura
async function handleSubscriptionNotification(data: any) {
  const subscriptionId = data.data.id;
  
  // Obter detalhes da assinatura
  const response = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
    headers: {
      'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao obter detalhes da assinatura: ${response.status}`);
  }
  
  const subscriptionData = await response.json();
  const { status, external_reference } = subscriptionData;
  
  console.log(`Assinatura ${subscriptionId} com status ${status}`);
  
  // Atualizar status da assinatura no banco de dados
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: status,
    })
    .eq('subscription_id', subscriptionId);
  
  if (error) {
    console.error('Erro ao atualizar status da assinatura:', error);
  }
}
