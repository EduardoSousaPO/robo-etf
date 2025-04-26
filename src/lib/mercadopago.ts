import { MERCADO_PAGO_ACCESS_TOKEN } from '@/lib/constants';

// Tipos para o Mercado Pago
type MercadoPagoPreference = {
  id: string;
  init_point: string;
  sandbox_init_point: string;
};

type MercadoPagoSubscription = {
  id: string;
  status: string;
  init_point: string;
};

// Função para criar uma preferência de pagamento (para pagamento único)
export async function createPaymentPreference(
  title: string,
  price: number,
  quantity: number,
  buyerEmail: string
): Promise<MercadoPagoPreference> {
  try {
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        items: [
          {
            title,
            unit_price: price,
            quantity,
            currency_id: 'BRL',
          },
        ],
        payer: {
          email: buyerEmail,
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/payment/failure`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/payment/pending`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao criar preferência: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as MercadoPagoPreference;
  } catch (error) {
    console.error('Erro ao criar preferência de pagamento:', error);
    throw error;
  }
}

// Função para criar uma assinatura (pagamento recorrente)
export async function createSubscription(
  planTitle: string,
  price: number,
  buyerEmail: string
): Promise<MercadoPagoSubscription> {
  try {
    // Primeiro, criar um plano
    const planResponse = await fetch('https://api.mercadopago.com/preapproval_plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        reason: planTitle,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: price,
          currency_id: 'BRL',
        },
      }),
    });
    
    if (!planResponse.ok) {
      throw new Error(`Erro ao criar plano: ${planResponse.status} ${planResponse.statusText}`);
    }
    
    const planData = await planResponse.json();
    
    // Depois, criar uma assinatura para esse plano
    const subscriptionResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        preapproval_plan_id: planData.id,
        reason: planTitle,
        external_reference: buyerEmail,
        payer_email: buyerEmail,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: price,
          currency_id: 'BRL',
        },
        back_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`,
        status: 'pending',
      }),
    });
    
    if (!subscriptionResponse.ok) {
      throw new Error(`Erro ao criar assinatura: ${subscriptionResponse.status} ${subscriptionResponse.statusText}`);
    }
    
    const subscriptionData = await subscriptionResponse.json();
    return subscriptionData as MercadoPagoSubscription;
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    throw error;
  }
}

// Função para verificar o status de uma assinatura
export async function getSubscriptionStatus(subscriptionId: string): Promise<string> {
  try {
    const response = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao verificar assinatura: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.status;
  } catch (error) {
    console.error('Erro ao verificar status da assinatura:', error);
    throw error;
  }
}

// Função para cancelar uma assinatura
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.mercadopago.com/preapproval/${subscriptionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        status: 'cancelled',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao cancelar assinatura: ${response.status} ${response.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    throw error;
  }
}
