import prisma from './db';
import { Profile, Portfolio } from '@prisma/client';

// --- Profile Operations ---

/**
 * Busca um perfil de usuário pelo ID.
 * @param userId - O ID do usuário (UUID).
 * @returns O perfil encontrado ou null se não existir.
 */
export async function getProfileById(userId: string): Promise<Profile | null> {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
    });
    return profile;
  } catch (error) {
    console.error(`Erro ao buscar perfil do usuário ${userId}:`, error);
    // Lançar o erro ou retornar null/erro customizado dependendo da estratégia de erro
    throw new Error(`Não foi possível buscar o perfil: ${(error as Error).message}`);
  }
}

/**
 * Cria ou atualiza um perfil de usuário.
 * @param profileData - Dados do perfil, incluindo o ID.
 * @returns O perfil criado ou atualizado.
 */
export async function createOrUpdateProfile(
  profileData: Pick<Profile, 'id'> & Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<Profile> {
  try {
    const { id, ...updateData } = profileData;
    
    // Garante que risk_score seja null se não for um número válido
    if (updateData.risk_score !== undefined && typeof updateData.risk_score !== 'number') {
      updateData.risk_score = null;
    }

    const profile = await prisma.profile.upsert({
      where: { id },
      update: updateData,
      create: {
        id,
        ...updateData,
        // Garante que campos obrigatórios na criação (se houver) sejam fornecidos
        // ou tenham valores padrão no schema
      },
    });
    return profile;
  } catch (error) {
    console.error('Erro ao criar/atualizar perfil:', error);
    throw new Error(`Não foi possível salvar o perfil: ${(error as Error).message}`);
  }
}

/**
 * Atualiza o status da assinatura de um usuário.
 * @param userId - O ID do usuário.
 * @param status - Novo status ('free' ou 'premium').
 * @param subscriptionId - (Opcional) ID da assinatura no provedor de pagamento.
 * @returns O perfil atualizado.
 */
export async function updateSubscriptionStatus(
  userId: string,
  status: string, // Manter como string para flexibilidade, validar antes de chamar
  subscriptionId?: string | null
): Promise<Profile> {
  try {
    if (status !== 'free' && status !== 'premium') {
      throw new Error('Status de assinatura inválido.');
    }
    
    const profile = await prisma.profile.update({
      where: { id: userId },
      data: {
        subscription_status: status,
        subscription_id: subscriptionId,
      },
    });
    return profile;
  } catch (error) {
    console.error(`Erro ao atualizar status da assinatura para usuário ${userId}:`, error);
    throw new Error(`Não foi possível atualizar a assinatura: ${(error as Error).message}`);
  }
}

// --- Portfolio Operations ---

/**
 * Busca todas as carteiras de um usuário, ordenadas pela data de criação (mais recente primeiro).
 * @param userId - O ID do usuário.
 * @returns Uma lista de carteiras.
 */
export async function getPortfoliosByUserId(userId: string): Promise<Portfolio[]> {
  try {
    const portfolios = await prisma.portfolio.findMany({
      where: { user_id: userId },
      orderBy: {
        created_at: 'desc',
      },
    });
    return portfolios;
  } catch (error) {
    console.error(`Erro ao buscar carteiras do usuário ${userId}:`, error);
    throw new Error(`Não foi possível buscar as carteiras: ${(error as Error).message}`);
  }
}

/**
 * Cria uma nova carteira para um usuário.
 * @param portfolioData - Dados da carteira (sem id e created_at).
 * @returns A carteira criada.
 */
export async function createPortfolio(
  portfolioData: Omit<Portfolio, 'id' | 'created_at'>
): Promise<Portfolio> {
  try {
    // Validar se weights e metrics são JSON válidos antes de inserir?
    // Prisma espera tipos `Json` definidos no schema
    const portfolio = await prisma.portfolio.create({
      data: portfolioData,
    });
    return portfolio;
  } catch (error) {
    console.error('Erro ao criar carteira:', error);
    throw new Error(`Não foi possível criar a carteira: ${(error as Error).message}`);
  }
}

// Adicionar outras funções conforme necessário (ex: getPortfolioById, updatePortfolio, etc.)

