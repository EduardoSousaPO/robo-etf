import { describe, it, expect, vi, beforeEach } from 'vitest';
import { optimizePortfolio } from '../src/lib/optim';
import { getHistoricalPrices } from '../src/lib/fmp';

// Mock das funções externas
vi.mock('../src/lib/fmp', () => ({
  getHistoricalPrices: vi.fn()
}));

describe('Algoritmo de Otimização', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deve otimizar uma carteira com base no perfil de risco', async () => {
    // Configurar mock para retornar dados históricos simulados
    const mockHistoricalData = [
      { date: '2020-01-01', close: 100 },
      { date: '2020-01-02', close: 102 },
      { date: '2020-01-03', close: 103 },
      { date: '2020-01-04', close: 101 },
      { date: '2020-01-05', close: 104 },
    ];
    
    (getHistoricalPrices as any).mockImplementation(() => Promise.resolve(mockHistoricalData));
    
    // Executar otimização
    const result = await optimizePortfolio(
      ['VTI', 'QQQ', 'SPY'], 
      3, // perfil de risco moderado
      '2020-01-01',
      '2020-01-05'
    );
    
    // Verificar se o resultado tem a estrutura esperada
    expect(result).toHaveProperty('weights');
    expect(result).toHaveProperty('metrics');
    expect(result.metrics).toHaveProperty('return');
    expect(result.metrics).toHaveProperty('volatility');
    expect(result.metrics).toHaveProperty('sharpe');
    
    // Verificar se os pesos somam aproximadamente 1
    const totalWeight = Object.values(result.weights).reduce((sum, weight) => sum + weight, 0);
    expect(totalWeight).toBeCloseTo(1, 1);
    
    // Verificar se os pesos respeitam as restrições
    Object.values(result.weights).forEach(weight => {
      expect(weight).toBeGreaterThanOrEqual(0.05);
      expect(weight).toBeLessThanOrEqual(0.3);
    });
  });
  
  it('deve substituir ETFs US por IE para perfis conservadores', async () => {
    // Configurar mock para retornar dados históricos simulados
    const mockHistoricalData = [
      { date: '2020-01-01', close: 100 },
      { date: '2020-01-02', close: 102 },
      { date: '2020-01-03', close: 103 },
      { date: '2020-01-04', close: 101 },
      { date: '2020-01-05', close: 104 },
    ];
    
    (getHistoricalPrices as any).mockImplementation(() => Promise.resolve(mockHistoricalData));
    
    // Executar otimização com perfil conservador
    const result = await optimizePortfolio(
      ['VTI', 'QQQ', 'SPY'], 
      2, // perfil de risco conservador
      '2020-01-01',
      '2020-01-05'
    );
    
    // Verificar se há substituição de ETFs US por IE
    const hasIEETFs = Object.keys(result.weights).some(symbol => symbol.includes('-IE'));
    expect(hasIEETFs).toBe(true);
  });
});
