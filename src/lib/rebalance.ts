import { supabase } from '@/lib/supabase';
import { optimizePortfolio } from '@/lib/optim';
import { getLiquidETFs } from '@/lib/fmp';
import { explainAllocation } from '@/lib/openai';

// Função para verificar carteiras que precisam de rebalanceamento
export async function checkPortfoliosForRebalance() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Buscar carteiras que precisam de rebalanceamento
    const { data: portfolios, error } = await supabase
      .from('portfolios')
      .select('id, user_id, weights, metrics, rebalance_date')
      .lte('rebalance_date', today);
    
    if (error) {
      throw error;
    }
    
    console.log(`Encontradas ${portfolios.length} carteiras para rebalanceamento`);
    
    // Processar cada carteira
    for (const portfolio of portfolios) {
      await processRebalance(portfolio);
    }
    
    return { success: true, count: portfolios.length };
  } catch (error) {
    console.error('Erro ao verificar carteiras para rebalanceamento:', error);
    return { success: false, error };
  }
}

// Processar rebalanceamento de uma carteira
async function processRebalance(portfolio: any) {
  try {
    // Obter perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('risk_score')
      .eq('id', portfolio.user_id)
      .single();
    
    if (profileError) {
      throw profileError;
    }
    
    // Verificar se o usuário tem assinatura ativa
    const hasActiveSubscription = await checkSubscription(portfolio.user_id);
    
    if (!hasActiveSubscription) {
      console.log(`Usuário ${portfolio.user_id} não tem assinatura ativa. Enviando notificação sem rebalanceamento.`);
      await sendRebalanceNotification(portfolio.user_id, portfolio.id, false);
      return;
    }
    
    // Obter ETFs líquidos
    const liquidETFs = await getLiquidETFs();
    const etfSymbols = liquidETFs.map(etf => etf.symbol);
    
    // Definir período para análise (5 anos)
    const toDate = new Date().toISOString().split('T')[0];
    const fromDate = new Date(
      new Date().setFullYear(new Date().getFullYear() - 5)
    ).toISOString().split('T')[0];
    
    // Executar otimização
    const result = await optimizePortfolio(
      etfSymbols,
      profile.risk_score,
      fromDate,
      toDate
    );
    
    // Adicionar data de rebalanceamento (6 meses a partir de hoje)
    const rebalanceDate = new Date();
    rebalanceDate.setMonth(rebalanceDate.getMonth() + 6);
    
    // Gerar explicação da nova carteira
    const explanation = await explainAllocation(result, profile.risk_score);
    
    // Salvar nova carteira
    const { data: newPortfolio, error: saveError } = await supabase
      .from('portfolios')
      .insert({
        user_id: portfolio.user_id,
        weights: result.weights,
        metrics: result.metrics,
        rebalance_date: rebalanceDate.toISOString().split('T')[0],
        previous_portfolio_id: portfolio.id,
        explanation
      })
      .select()
      .single();
    
    if (saveError) {
      throw saveError;
    }
    
    // Enviar notificação de rebalanceamento
    await sendRebalanceNotification(portfolio.user_id, newPortfolio.id, true);
    
    console.log(`Rebalanceamento concluído para carteira ${portfolio.id}`);
    
    return { success: true, portfolio: newPortfolio };
  } catch (error) {
    console.error(`Erro ao rebalancear carteira ${portfolio.id}:`, error);
    return { success: false, error };
  }
}

// Verificar se o usuário tem assinatura ativa
async function checkSubscription(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', userId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data.subscription_status === 'authorized';
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return false;
  }
}

// Enviar notificação de rebalanceamento
async function sendRebalanceNotification(
  userId: string,
  portfolioId: string,
  isAutoRebalanced: boolean
) {
  try {
    // Na implementação real, enviaria e-mail e WhatsApp
    console.log(`Enviando notificação para usuário ${userId} sobre carteira ${portfolioId}`);
    
    // Registrar notificação
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'rebalance',
        portfolio_id: portfolioId,
        is_auto_rebalanced: isAutoRebalanced,
        read: false
      });
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return { success: false, error };
  }
}

// Verificar drawdown significativo (queda > 15%)
export async function checkSignificantDrawdown() {
  try {
    // Na implementação real, verificaria preços atuais dos ETFs
    // e calcularia o drawdown para cada carteira
    
    // Exemplo simplificado
    const { data: portfolios, error } = await supabase
      .from('portfolios')
      .select('id, user_id, weights')
      .is('drawdown_notified', null);
    
    if (error) {
      throw error;
    }
    
    console.log(`Verificando drawdown para ${portfolios.length} carteiras`);
    
    // Processar cada carteira
    for (const portfolio of portfolios) {
      // Simulação: 10% das carteiras têm drawdown significativo
      const hasSignificantDrawdown = Math.random() < 0.1;
      
      if (hasSignificantDrawdown) {
        await sendDrawdownAlert(portfolio.user_id, portfolio.id);
        
        // Marcar como notificado
        await supabase
          .from('portfolios')
          .update({ drawdown_notified: true })
          .eq('id', portfolio.id);
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao verificar drawdown:', error);
    return { success: false, error };
  }
}

// Enviar alerta de drawdown
async function sendDrawdownAlert(userId: string, portfolioId: string) {
  try {
    // Na implementação real, enviaria e-mail e WhatsApp
    console.log(`Enviando alerta de drawdown para usuário ${userId} sobre carteira ${portfolioId}`);
    
    // Registrar notificação
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'drawdown',
        portfolio_id: portfolioId,
        read: false
      });
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar alerta de drawdown:', error);
    return { success: false, error };
  }
}
