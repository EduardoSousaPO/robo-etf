import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';
import { WebhookEvent } from '@clerk/nextjs/server';

// Interface para os dados do usuário do Clerk
interface ClerkUser {
  id: string;
  email_addresses: { email_address: string }[];
  first_name?: string;
  last_name?: string;
}

// Configuração do Supabase com chave de serviço
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para processar evento de criação de usuário
async function handleUserCreated(user: ClerkUser) {
  try {
    const { id, email_addresses, first_name, last_name } = user;
    const email = email_addresses[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(' ');

    // Criar perfil no Supabase
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id,
        email,
        name: name || null,
        subscription_status: 'free',
        created_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('Erro ao criar perfil do usuário no Supabase:', error);
      return false;
    }

    console.log('Perfil de usuário criado/atualizado com sucesso:', data);
    return true;
  } catch (error) {
    console.error('Erro ao processar evento user.created:', error);
    return false;
  }
}

// Função para processar evento de atualização de usuário
async function handleUserUpdated(user: ClerkUser) {
  try {
    const { id, email_addresses, first_name, last_name } = user;
    const email = email_addresses[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(' ');

    // Atualizar perfil no Supabase
    const { data, error } = await supabase
      .from('profiles')
      .update({
        email,
        name: name || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Erro ao atualizar perfil do usuário no Supabase:', error);
      return false;
    }

    console.log('Perfil de usuário atualizado com sucesso:', data);
    return true;
  } catch (error) {
    console.error('Erro ao processar evento user.updated:', error);
    return false;
  }
}

// Função para processar evento de exclusão de usuário
async function handleUserDeleted(userId: string) {
  try {
    // Não excluímos o usuário, apenas marcamos como desativado
    const { error } = await supabase
      .from('profiles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Erro ao marcar usuário como desativado no Supabase:', error);
      return false;
    }

    console.log('Usuário marcado como desativado com sucesso:', userId);
    return true;
  } catch (error) {
    console.error('Erro ao processar evento user.deleted:', error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Verificar segredo do webhook
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Segredo do webhook não configurado');
    return NextResponse.json({ error: 'Webhook não configurado' }, { status: 500 });
  }

  // Obter cabeçalhos e corpo do webhook
  const payload = await req.text();
  const headerPayload = req.headers;
  const svixHeaders = {
    'svix-id': headerPayload.get('svix-id') || '',
    'svix-timestamp': headerPayload.get('svix-timestamp') || '',
    'svix-signature': headerPayload.get('svix-signature') || '',
  };

  // Validar assinatura do webhook
  let event: WebhookEvent | null = null;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(payload, svixHeaders) as WebhookEvent;
  } catch (error) {
    console.error('Erro ao verificar webhook:', error);
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 });
  }

  // Processar evento conforme o tipo
  const eventType = event.type;

  if (eventType === 'user.created') {
    await handleUserCreated(event.data as ClerkUser);
  } else if (eventType === 'user.updated') {
    await handleUserUpdated(event.data as ClerkUser);
  } else if (eventType === 'user.deleted') {
    if (event.data.id) {
      await handleUserDeleted(event.data.id as string);
    }
  }

  return NextResponse.json({ success: true });
}
