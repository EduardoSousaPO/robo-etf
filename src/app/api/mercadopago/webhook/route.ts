import { NextRequest, NextResponse } from 'next/server';
import { updateSubscriptionStatus } from '@/lib/repository'; // Use Prisma repository
import { MERCADO_PAGO_ACCESS_TOKEN } from '@/lib/constants';
import crypto from 'crypto';

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
  type: 'payment' | 'preapproval' | 'subscription_preapproval' | string; // Added preapproval types
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

// Interface para Preapproval (Assinatura)
interface PreapprovalData {
  id: string;
  status: string; // authorized, paused, cancelled, pending
  payer_id: string;
  external_reference?: string;
  reason: string;
  date_created: string;
  next_payment_date: string;
  // Add other relevant fields as needed
}

// Variável de ambiente para a chave secreta do webhook (IMPORTANTE: Definir no .env)
const MERCADO_PAGO_WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

/**
 * Verifica a assinatura do webhook do Mercado Pago.
 * Adaptado da documentação oficial.
 */
function verifyWebhookSignature(request: NextRequest, rawBody: string): boolean {
  if (!MERCADO_PAGO_WEBHOOK_SECRET) {
    console.warn('Chave secreta do webhook do Mercado Pago não configurada. Pulando verificação.');
    // Em produção, isso deveria retornar false ou lançar um erro.
    return true; // Permitir em desenvolvimento sem a chave
  }

  const signatureHeader = request.headers.get('x-signature');
  const requestId = request.headers.get('x-request-id');

  if (!signatureHeader || !requestId) {
    console.error('Cabeçalhos de assinatura do webhook ausentes.');
    return false;
  }

  const parts = signatureHeader.split(',');
  const signatureParts = parts.reduce((acc, part) => {
    const [key, value] = part.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const timestamp = signatureParts['ts'];
  const receivedHash = signatureParts['v1'];

  if (!timestamp || !receivedHash) {
    console.error('Partes da assinatura do webhook inválidas.');
    return false;
  }

  const manifest = `id:${payload.data.id};request-id:${requestId};ts:${timestamp};`;
  const calculatedHash = crypto
    .createHmac('sha256', MERCADO_PAGO_WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex');

  if (calculatedHash !== receivedHash) {
    console.error('Assinatura do webhook inválida.');
    return false;
  }

  // Opcional: Verificar timestamp para evitar ataques de replay
  const now = Date.now();
  const receivedTimestamp = parseInt(timestamp, 10) * 1000;
  if (Math.abs(now - receivedTimestamp) > 300000) { // 5 minutos de tolerância
    console.warn('Timestamp do webhook fora da tolerância.');
    // Não falhar estritamente por isso, mas registrar
  }

  return true;
}

let payload: WebhookPayload; // Declare payload outside try block

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    console.log('🚀 ~ Webhook Mercado Pago recebido');
    rawBody = await request.text(); // Ler o corpo como texto para verificação
    payload = JSON.parse(rawBody) as WebhookPayload; // Fazer parse do JSON
    console.log('Payload recebido:', payload);

    // Verificar assinatura do webhook
    // if (!verifyWebhookSignature(request, rawBody)) {
    //   console.error('Falha na verificação da assinatura do webhook.');
    //   return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 });
    // }
    // console.log('Assinatura do webhook verificada com sucesso.');

    // Tratar diferentes tipos de notificação
    if (payload.type === 'payment') {
      console.log(`Processando notificação de pagamento: ${payload.data.id}`);
      return await handlePaymentNotification(payload.data.id);
    } else if (payload.type === 'preapproval' || payload.type === 'subscription_preapproval') {
      console.log(`Processando notificação de assinatura (preapproval): ${payload.data.id}`);
      return await handleSubscriptionNotification(payload.data.id);
    } else {
      console.log(`Tipo de webhook não tratado: ${payload.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    const errorMessage = error.message || 'Erro interno ao processar webhook';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

async function handlePaymentNotification(paymentId: string) {
  try {
    // Obter detalhes do pagamento da API do Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter detalhes do pagamento ${paymentId}: ${response.statusText}`);
    }

    const paymentData: PaymentData = await response.json();
    console.log('Dados do Pagamento:', paymentData);

    // Processar pagamento aprovado - Geralmente associado a uma assinatura via external_reference
    if (paymentData.status === 'approved' && paymentData.external_reference) {
      const userId = paymentData.external_reference;
      console.log(`Pagamento ${paymentId} aprovado para usuário ${userId}. Atualizando status para premium.`);

      try {
        await updateSubscriptionStatus(userId, 'premium'); // Usar função do repositório Prisma
        console.log(`Status da assinatura atualizado para premium para o usuário ${userId}`);
      } catch (dbError: any) {
        console.error(`Erro ao atualizar status da assinatura para ${userId} no banco de dados:`, dbError);
        // Continuar mesmo se o DB falhar? Ou retornar erro 500?
        // Por enquanto, logamos o erro mas retornamos sucesso para o MP
      }
    } else {
      console.log(`Pagamento ${paymentId} com status ${paymentData.status} não requer atualização de status premium.`);
    }

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error(`Erro ao processar notificação de pagamento ${paymentId}:`, error);
    return NextResponse.json({ error: `Erro ao processar notificação de pagamento: ${error.message}` }, { status: 500 });
  }
}

async function handleSubscriptionNotification(subscriptionId: string) {
  try {
    // Obter detalhes da assinatura da API do Mercado Pago
    const response = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
      headers: {
        Authorization: `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter detalhes da assinatura ${subscriptionId}: ${response.statusText}`);
    }

    const subscriptionData: PreapprovalData = await response.json();
    console.log('Dados da Assinatura (Preapproval):', subscriptionData);

    // Processar mudança de status da assinatura usando external_reference como userId
    if (subscriptionData.external_reference) {
      const userId = subscriptionData.external_reference;
      let newDbStatus: 'premium' | 'free' = 'free'; // Default to free

      // Mapear status do Mercado Pago para status do nosso banco
      switch (subscriptionData.status) {
        case 'authorized': // Assinatura ativa e pronta para cobrar
        case 'paused': // Assinatura pausada, mas ainda pode ser reativada (considerar premium?)
          newDbStatus = 'premium';
          break;
        case 'pending': // Aguardando pagamento ou confirmação
          // Manter o status atual ou definir como 'pending'? Por ora, manter free.
          console.log(`Assinatura ${subscriptionId} para usuário ${userId} está pendente.`);
          // Não atualiza o status no DB ainda, espera pagamento ser aprovado.
          return NextResponse.json({ ok: true, message: 'Status pendente, aguardando pagamento.' });
        case 'cancelled': // Assinatura cancelada
          newDbStatus = 'free';
          break;
        default:
          console.warn(`Status de assinatura não mapeado: ${subscriptionData.status}`);
          newDbStatus = 'free'; // Segurança: default para free
      }

      console.log(`Assinatura ${subscriptionId} para usuário ${userId}. Atualizando status para ${newDbStatus}.`);

      try {
        // Atualizar status da assinatura do usuário no banco de dados usando Prisma
        await updateSubscriptionStatus(userId, newDbStatus, subscriptionId);
        console.log(`Status da assinatura atualizado para ${newDbStatus} para o usuário ${userId}`);
      } catch (dbError: any) {
        console.error(`Erro ao atualizar status da assinatura para ${userId} no banco de dados:`, dbError);
        // Continuar mesmo se o DB falhar? Ou retornar erro 500?
        // Por enquanto, logamos o erro mas retornamos sucesso para o MP
      }
    } else {
      console.warn(`Webhook de assinatura ${subscriptionId} recebido sem external_reference.`);
    }

    return NextResponse.json({ ok: true });

  } catch (error: any) {
    console.error(`Erro ao processar notificação de assinatura ${subscriptionId}:`, error);
    return NextResponse.json({ error: `Erro ao processar notificação de assinatura: ${error.message}` }, { status: 500 });
  }
}

