import { test, expect } from '@playwright/test';

// Testes E2E para o fluxo principal do Robo-ETF
test.describe('Robo-ETF E2E Tests', () => {
  // Teste do fluxo feliz: usuário completa questionário e recebe carteira
  test('happy path: user completes questionnaire and receives portfolio', async ({ page }) => {
    // Visitar a página inicial
    await page.goto('/');
    
    // Verificar se a página carregou corretamente
    await expect(page.getByText('Carteira Inteligente de ETFs em 5 minutos')).toBeVisible();
    
    // Clicar no botão para iniciar o questionário
    await page.getByText('Criar Minha Carteira').click();
    
    // Verificar se o questionário carregou
    await expect(page.getByText('Vamos conhecer seu perfil de investidor')).toBeVisible();
    
    // Responder às 6 perguntas do questionário
    // Pergunta 1: Horizonte de tempo
    await page.getByText('Mais de 10 anos').click();
    await page.getByText('Próximo').click();
    
    // Pergunta 2: Tolerância a risco
    await page.getByText('Manteria o investimento sem preocupação').click();
    await page.getByText('Próximo').click();
    
    // Pergunta 3: Experiência com investimentos
    await page.getByText('Experiência com diversos tipos de investimentos').click();
    await page.getByText('Próximo').click();
    
    // Pergunta 4: Estabilidade da renda
    await page.getByText('Estável').click();
    await page.getByText('Próximo').click();
    
    // Pergunta 5: Reserva de emergência
    await page.getByText('6-12 meses de despesas').click();
    await page.getByText('Próximo').click();
    
    // Pergunta 6: Objetivo do investimento
    await page.getByText('Crescimento de longo prazo').click();
    await page.getByText('Finalizar').click();
    
    // Verificar se a página de portfolio carregou
    await expect(page.getByText('Sua Carteira Otimizada')).toBeVisible();
    
    // Verificar se as métricas da carteira estão visíveis
    await expect(page.getByText('Retorno Esperado (anual)')).toBeVisible();
    await expect(page.getByText('Volatilidade (anual)')).toBeVisible();
    await expect(page.getByText('Índice Sharpe')).toBeVisible();
    
    // Verificar se os botões de exportação estão disponíveis
    await expect(page.getByText('Exportar CSV')).toBeVisible();
    await expect(page.getByText('Explicação da Carteira')).toBeVisible();
  });
  
  // Teste de erro: falha na API FMP
  test('error handling: FMP API failure', async ({ page }) => {
    // Simular falha na API FMP (na implementação real, usaria mocks)
    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Erro ao processar a otimização da carteira.' }),
      });
    });
    
    // Visitar a página de portfolio diretamente com um perfil de risco
    await page.goto('/portfolio?risk_score=3');
    
    // Verificar se a mensagem de erro é exibida
    await expect(page.getByText('Ops! Algo deu errado')).toBeVisible();
    await expect(page.getByText('Erro ao carregar carteira. Por favor, tente novamente.')).toBeVisible();
    
    // Verificar se o botão para tentar novamente está disponível
    await expect(page.getByText('Tentar Novamente')).toBeVisible();
  });
  
  // Teste de navegação: usuário acessa página de conta
  test('navigation: user accesses account page', async ({ page }) => {
    // Simular usuário autenticado (na implementação real, faria login)
    await page.goto('/account');
    
    // Verificar se a página de conta carregou
    await expect(page.getByText('Minha Conta')).toBeVisible();
    
    // Verificar se as abas estão disponíveis
    await expect(page.getByText('Assinatura')).toBeVisible();
    await expect(page.getByText('Perfil')).toBeVisible();
    
    // Clicar na aba de perfil
    await page.getByText('Perfil').click();
    
    // Verificar se o conteúdo da aba de perfil é exibido
    await expect(page.getByText('Informações Pessoais')).toBeVisible();
  });
});
