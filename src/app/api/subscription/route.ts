import { NextRequest, NextResponse } from 'next/server';
import Mercadopago from 'mercadopago';
// import { verifyUserToken } from '@/lib/auth'; // TODO: Replace with Clerk auth check
import { getAuth } from '@clerk/nextjs/server'; // Use Clerk server-side auth
import { getProfileById, createOrUpdateProfile, updateSubscriptionStatus } from '@/lib/repository'; // Use Prisma repository
import { MERCADO_PAGO_ACCESS_TOKEN } from '@/lib/constants';

// Configure o cliente Mercado Pago
Mercadopago.configure({
  access_token: MERCADO_PAGO_ACCESS_TOKEN
});

export async function POST(request: NextRequest) {
  try {
    // Verificar a autenticação do usuário usando Clerk
    const { userId } = getAuth(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }
    
    // Buscar dados do perfil do usuário usando o repositório Prisma
    const profile = await getProfileById(userId);
    if (!profile) {
      // Se o perfil não existe, talvez criar um básico? Ou retornar erro?
      // Por agora, vamos retornar erro, mas idealmente o perfil deve ser criado no onboarding/login inicial.
      console.error(`Perfil não encontrado para o usuário ${userId} ao tentar criar assinatura.`);
      return NextResponse.json({ error: 'Perfil de usuário não encontrado' }, { status: 404 });
    }

    // Obter email do usuário (pode precisar buscar no Clerk se não estiver no profile)
    // const user = await clerkClient.users.getUser(userId); // Exemplo se precisar buscar no Clerk
    // const userEmail = user?.emailAddresses?.[0]?.emailAddress;
    // if (!userEmail) {
    //   return NextResponse.json({ error: 'Email do usuário não encontrado' }, { status: 400 });
    // }
    // Por simplicidade, vamos assumir que o email está disponível ou não é estritamente necessário pelo MP agora
    const userEmail = 'test@example.com'; // Placeholder - REMOVER E OBTER EMAIL REAL

    // Criar uma preferência de assinatura no Mercado Pago
    const preference = {
      reason: 'Assinatura Robo-ETF Premium',
      payer_email: userEmail, // Usar email real do usuário
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 49.90, // Ajustar preço conforme necessário
        currency_id: "BRL"
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/dashboard?subscription=success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/account?subscription=failed`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/account?subscription=pending`
      },
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/api/mercadopago/webhook`,
      // metadata: { // Metadata não é suportado diretamente em preapproval, usar external_reference?
      //   user_id: userId,
      // },
      external_reference: userId, // Usar external_reference para associar ao usuário
    };

    console.log('Criando preferência de assinatura no Mercado Pago:', preference);

    const response = await Mercadopago.preapproval.create(preference);

    console.log('Resposta do Mercado Pago:', response.body);

    if (!response?.body?.id) {
        throw new Error('Falha ao criar assinatura no Mercado Pago: ID não retornado.');
    }

    // Atualizar o perfil do usuário com o status 'pending' ou 'authorized' dependendo da resposta?
    // O webhook cuidará da atualização final, mas podemos marcar como pendente aqui.
    // Por enquanto, vamos apenas retornar o link de pagamento.
    // await updateSubscriptionStatus(userId, 'pending', response.body.id); // Exemplo

    return NextResponse.json({
      success: true,
      subscription: {
        id: response.body.id,
        init_point: response.body.init_point, // URL para onde o usuário deve ser redirecionado para pagar
      }
    });

  } catch (error: any) {
    console.error('Erro ao criar assinatura:', error);
    // Verificar se o erro é do Mercado Pago para retornar mensagem mais específica
    const errorMessage = error?.cause?.message || error.message || 'Erro interno do servidor';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

