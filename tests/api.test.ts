import { describe, it, expect, vi, beforeEach } from 'vitest';
import { optimizePortfolio } from '../src/lib/optim';
import { getLiquidETFs } from '../src/lib/fmp';
import { explainAllocation } from '../src/lib/openai';

// Mock das funções externas
vi.mock('../src/lib/optim', () => ({
  optimizePortfolio: vi.fn()
}));

vi.mock('../src/lib/fmp', () => ({
  getLiquidETFs: vi.fn()
}));

vi.mock('../src/lib/openai', () => ({
  explainAllocation: vi.fn()
}));

// Mock do Next.js Response
const mockJson = vi.fn();
const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
const mockNextResponse = {
  json: mockJson,
  status: mockStatus
};

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: any) => ({ ...mockNextResponse, data }),
    status: mockStatus
  }
}));

describe('API Routes', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('/api/optimize', () => {
    it('should return optimized portfolio when valid risk score is provided', async () => {
      // Importar a rota da API
      const { POST } = await import('../src/app/api/optimize/route');
      
      // Mock dos dados de retorno
      const mockETFs = [{ symbol: 'VTI' }, { symbol: 'QQQ' }];
      const mockPortfolio = {
        weights: { VTI: 0.6, QQQ: 0.4 },
        metrics: {
          return: 0.08,
          volatility: 0.15,
          sharpe: 0.4
        }
      };
      
      // Configurar mocks
      getLiquidETFs.mockResolvedValue(mockETFs);
      optimizePortfolio.mockResolvedValue(mockPortfolio);
      
      // Criar request mock
      const request = {
        json: vi.fn().mockResolvedValue({ riskScore: 3 })
      };
      
      // Chamar a rota da API
      await POST(request as any);
      
      // Verificar se as funções foram chamadas corretamente
      expect(getLiquidETFs).toHaveBeenCalled();
      expect(optimizePortfolio).toHaveBeenCalledWith(
        ['VTI', 'QQQ'],
        3,
        expect.any(String),
        expect.any(String)
      );
      
      // Verificar se a resposta foi formatada corretamente
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          weights: { VTI: 0.6, QQQ: 0.4 },
          metrics: {
            return: 0.08,
            volatility: 0.15,
            sharpe: 0.4
          },
          rebalance_date: expect.any(String)
        })
      );
    });

    it('should return error when invalid risk score is provided', async () => {
      // Importar a rota da API
      const { POST } = await import('../src/app/api/optimize/route');
      
      // Criar request mock com risco inválido
      const request = {
        json: vi.fn().mockResolvedValue({ riskScore: 6 })
      };
      
      // Chamar a rota da API
      await POST(request as any);
      
      // Verificar se retornou erro
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Perfil de risco inválido')
        })
      );
    });
  });

  describe('/api/explain', () => {
    it('should return explanation when valid portfolio and risk score are provided', async () => {
      // Importar a rota da API
      const { POST } = await import('../src/app/api/explain/route');
      
      // Mock dos dados
      const mockPortfolio = {
        weights: { VTI: 0.6, QQQ: 0.4 },
        metrics: {
          return: 0.08,
          volatility: 0.15,
          sharpe: 0.4
        }
      };
      const mockExplanation = 'Esta é uma explicação da carteira';
      
      // Configurar mock
      explainAllocation.mockResolvedValue(mockExplanation);
      
      // Criar request mock
      const request = {
        json: vi.fn().mockResolvedValue({
          portfolio: mockPortfolio,
          riskScore: 3
        })
      };
      
      // Chamar a rota da API
      await POST(request as any);
      
      // Verificar se as funções foram chamadas corretamente
      expect(explainAllocation).toHaveBeenCalledWith(mockPortfolio, 3);
      
      // Verificar se a resposta foi formatada corretamente
      expect(mockJson).toHaveBeenCalledWith({ explanation: mockExplanation });
    });

    it('should return error when required data is missing', async () => {
      // Importar a rota da API
      const { POST } = await import('../src/app/api/explain/route');
      
      // Criar request mock com dados incompletos
      const request = {
        json: vi.fn().mockResolvedValue({ riskScore: 3 }) // Sem portfolio
      };
      
      // Chamar a rota da API
      await POST(request as any);
      
      // Verificar se retornou erro
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Dados incompletos')
        })
      );
    });
  });
});
