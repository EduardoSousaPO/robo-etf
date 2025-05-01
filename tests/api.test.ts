import { describe, it, expect, vi, beforeEach } from 'vitest';
import { optimizePortfolio } from '../src/lib/optim';
import { getLiquidETFs } from '../src/lib/fmp';
import { explainAllocation, getChatCompletion } from '../src/lib/openai'; // Added getChatCompletion
import * as repository from '../src/lib/repository'; // Import repository functions
import { generatePdf } from '../src/lib/pdf-generator'; // For PDF route test
import { createClient } from '@supabase/supabase-js'; // For PDF route test
import mercadopago from 'mercadopago'; // For Subscription route test
import { OpenAIStream, StreamingTextResponse } from 'ai'; // For Chat route test
import { rebalancePortfolios } from '../src/lib/rebalance'; // For Cron Rebalance test
import { checkDrawdown } from '../src/lib/drawdown'; // For Cron Drawdown test

// --- Mock External Libraries ---
vi.mock('../src/lib/optim', () => ({
  optimizePortfolio: vi.fn()
}));

vi.mock('../src/lib/fmp', () => ({
  getLiquidETFs: vi.fn()
}));

// Mock OpenAI functions
const mockExplainAllocation = vi.fn();
const mockGetChatCompletion = vi.fn();
vi.mock('../src/lib/openai', () => ({
  explainAllocation: mockExplainAllocation,
  getChatCompletion: mockGetChatCompletion,
}));

// Mock pdf-generator
vi.mock('../src/lib/pdf-generator', () => ({
  generatePdf: vi.fn(),
}));

// Mock Supabase client for Storage
const mockUpload = vi.fn();
const mockStorageFrom = vi.fn(() => ({ upload: mockUpload }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ storage: { from: mockStorageFrom } })),
}));

// Mock Mercado Pago SDK
const mockPreferenceCreate = vi.fn();
const mockPaymentFindById = vi.fn(); // Mock for webhook
vi.mock('mercadopago', () => {
  const mockConfigure = vi.fn();
  const mockPreferences = { create: mockPreferenceCreate };
  const mockPayment = { findById: mockPaymentFindById }; // Add payment mock
  return {
    default: {
      configure: mockConfigure,
      preferences: mockPreferences,
      payment: mockPayment, // Include payment
    },
    configure: mockConfigure,
    preferences: mockPreferences,
    payment: mockPayment, // Include payment
  };
});

// Mock 'ai' library for StreamingTextResponse
vi.mock('ai', () => ({
  OpenAIStream: vi.fn(),
  StreamingTextResponse: vi.fn().mockImplementation((stream) => {
    // Simulate reading the stream for testing purposes if needed
    return { body: stream }; // Return a mock response object
  }),
}));

// Mock rebalance and drawdown functions
const mockRebalancePortfolios = vi.fn();
const mockCheckDrawdown = vi.fn();
vi.mock('../src/lib/rebalance', () => ({
  rebalancePortfolios: mockRebalancePortfolios,
}));
vi.mock('../src/lib/drawdown', () => ({
  checkDrawdown: mockCheckDrawdown,
}));


// --- Mock Clerk Authentication ---
const mockGetAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  getAuth: mockGetAuth,
  clerkMiddleware: vi.fn(), // Mock middleware if needed elsewhere
}));

// --- Mock Prisma Repository ---
// Create mocks for each repository function
const mockGetProfileById = vi.fn();
const mockCreateOrUpdateProfile = vi.fn();
const mockGetPortfoliosByUserId = vi.fn();
const mockCreatePortfolio = vi.fn();
const mockUpdateSubscriptionStatus = vi.fn(); // Mock for webhook

// Mock the repository module
vi.mock('../src/lib/repository', async (importOriginal) => {
  const original = await importOriginal<typeof repository>();
  return {
    ...original, // Keep original exports if needed, though we mock specific ones
    getProfileById: mockGetProfileById,
    createOrUpdateProfile: mockCreateOrUpdateProfile,
    getPortfoliosByUserId: mockGetPortfoliosByUserId,
    createPortfolio: mockCreatePortfolio,
    updateSubscriptionStatus: mockUpdateSubscriptionStatus, // Include webhook mock
  };
});

// --- Mock Next.js Response ---
const mockJson = vi.fn();
const mockStatus = vi.fn().mockReturnValue({ json: mockJson });

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, options?: { status?: number }) => {
      const status = options?.status ?? 200;
      mockStatus(status); // Call mockStatus with the determined status
      mockJson(data); // Call mockJson with the data
      // Return a representation for chaining or inspection if needed
      return { status, data };
    },
  }
}));

// --- Test Suites ---
describe('API Routes', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    // Default mock for authenticated user
    mockGetAuth.mockReturnValue({ userId: 'user_test_123' });
    // Mock CRON_API_KEY for cron tests
    process.env = { ...OLD_ENV, CRON_API_KEY: 'test-cron-key' };
  });

  afterAll(() => {
    process.env = OLD_ENV; // Restore old environment
  });

  // --- /api/optimize Tests ---
  describe('/api/optimize', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetAuth.mockReturnValue({ userId: null }); // Simulate unauthenticated user
      const { POST } = await import('../src/app/api/optimize/route');
      const request = { json: vi.fn().mockResolvedValue({ riskScore: 3 }) };
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return optimized portfolio and save it when valid risk score is provided', async () => {
      const { POST } = await import('../src/app/api/optimize/route');
      const mockETFs = [{ symbol: 'VTI' }, { symbol: 'QQQ' }];
      const mockOptimizedData = {
        weights: { VTI: 0.6, QQQ: 0.4 },
        metrics: { return: 0.08, volatility: 0.15, sharpe: 0.4 }
      };
      const mockSavedPortfolio = { ...mockOptimizedData, id: 'p1', userId: 'user_test_123', riskScore: 3, createdAt: new Date() };

      getLiquidETFs.mockResolvedValue(mockETFs);
      optimizePortfolio.mockResolvedValue(mockOptimizedData);
      mockCreatePortfolio.mockResolvedValue(mockSavedPortfolio); // Mock saving

      const request = { json: vi.fn().mockResolvedValue({ riskScore: 3 }) };
      await POST(request as any);

      expect(getLiquidETFs).toHaveBeenCalled();
      expect(optimizePortfolio).toHaveBeenCalledWith(['VTI', 'QQQ'], 3, expect.any(String), expect.any(String));
      expect(mockCreatePortfolio).toHaveBeenCalledWith('user_test_123', 3, mockOptimizedData.weights, mockOptimizedData.metrics);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining(mockOptimizedData));
      expect(mockStatus).toHaveBeenCalledWith(200); // Explicitly check for 200
    });

    it('should return 400 error when invalid risk score is provided', async () => {
      const { POST } = await import('../src/app/api/optimize/route');
      const request = { json: vi.fn().mockResolvedValue({ riskScore: 6 }) };
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Perfil de risco inválido. Deve ser entre 1 e 5.' });
    });

     it('should return 500 error if optimization fails', async () => {
      const { POST } = await import('../src/app/api/optimize/route');
      getLiquidETFs.mockResolvedValue([{ symbol: 'VTI' }]);
      optimizePortfolio.mockRejectedValue(new Error('Optimization failed')); // Simulate error

      const request = { json: vi.fn().mockResolvedValue({ riskScore: 3 }) };
      await POST(request as any);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao otimizar portfólio: Optimization failed' });
    });

     it('should return 500 error if saving portfolio fails', async () => {
      const { POST } = await import('../src/app/api/optimize/route');
      const mockETFs = [{ symbol: 'VTI' }];
      const mockOptimizedData = { weights: { VTI: 1.0 }, metrics: {} };

      getLiquidETFs.mockResolvedValue(mockETFs);
      optimizePortfolio.mockResolvedValue(mockOptimizedData);
      mockCreatePortfolio.mockRejectedValue(new Error('DB save failed')); // Simulate save error

      const request = { json: vi.fn().mockResolvedValue({ riskScore: 3 }) };
      await POST(request as any);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao salvar portfólio otimizado: DB save failed' });
    });
  });

  // --- /api/explain Tests ---
  describe('/api/explain', () => {
     it('should return 401 if user is not authenticated', async () => {
      mockGetAuth.mockReturnValue({ userId: null });
      const { POST } = await import('../src/app/api/explain/route');
      const request = { json: vi.fn().mockResolvedValue({ portfolio: {}, riskScore: 3 }) };
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return explanation when valid portfolio and risk score are provided', async () => {
      const { POST } = await import('../src/app/api/explain/route');
      const mockPortfolio = { weights: { VTI: 0.6, QQQ: 0.4 }, metrics: {} };
      const mockExplanation = 'Esta é uma explicação da carteira';
      mockExplainAllocation.mockResolvedValue(mockExplanation);

      const request = { json: vi.fn().mockResolvedValue({ portfolio: mockPortfolio, riskScore: 3 }) };
      await POST(request as any);

      expect(mockExplainAllocation).toHaveBeenCalledWith(mockPortfolio, 3);
      expect(mockJson).toHaveBeenCalledWith({ explanation: mockExplanation });
      expect(mockStatus).toHaveBeenCalledWith(200); // Explicitly check for 200
    });

    it('should return 400 error when required data is missing (no portfolio)', async () => {
      const { POST } = await import('../src/app/api/explain/route');
      const request = { json: vi.fn().mockResolvedValue({ riskScore: 3 }) }; // Missing portfolio
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Dados incompletos: portfolio e riskScore são obrigatórios.' });
    });

     it('should return 400 error when required data is missing (no riskScore)', async () => {
      const { POST } = await import('../src/app/api/explain/route');
      const request = { json: vi.fn().mockResolvedValue({ portfolio: {} }) }; // Missing riskScore
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Dados incompletos: portfolio e riskScore são obrigatórios.' });
    });

    it('should return 500 error if OpenAI call fails', async () => {
      const { POST } = await import('../src/app/api/explain/route');
      mockExplainAllocation.mockRejectedValue(new Error('OpenAI API error')); // Simulate error
      const request = { json: vi.fn().mockResolvedValue({ portfolio: {}, riskScore: 3 }) };
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao gerar explicação: OpenAI API error' });
    });
  });

  // --- /api/profile Tests ---
  describe('/api/profile', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetAuth.mockReturnValue({ userId: null });
      const { POST } = await import('../src/app/api/profile/route');
      const request = { json: vi.fn().mockResolvedValue({ name: 'Test', riskScore: 3 }) };
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should create or update profile successfully', async () => {
      const { POST } = await import('../src/app/api/profile/route');
      const requestData = { name: 'Test User', riskScore: 4 };
      const mockUpdatedProfile = { id: 'user_test_123', ...requestData, subscriptionStatus: 'inactive' };
      mockCreateOrUpdateProfile.mockResolvedValue(mockUpdatedProfile);

      const request = { json: vi.fn().mockResolvedValue(requestData) };
      await POST(request as any);

      expect(mockCreateOrUpdateProfile).toHaveBeenCalledWith('user_test_123', requestData.name, requestData.riskScore);
      expect(mockJson).toHaveBeenCalledWith(mockUpdatedProfile);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 if name is missing', async () => {
      const { POST } = await import('../src/app/api/profile/route');
      const request = { json: vi.fn().mockResolvedValue({ riskScore: 3 }) }; // Missing name
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Nome e perfil de risco são obrigatórios.' });
    });

    it('should return 400 if riskScore is missing', async () => {
      const { POST } = await import('../src/app/api/profile/route');
      const request = { json: vi.fn().mockResolvedValue({ name: 'Test' }) }; // Missing riskScore
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Nome e perfil de risco são obrigatórios.' });
    });

    it('should return 400 if riskScore is invalid (less than 1)', async () => {
      const { POST } = await import('../src/app/api/profile/route');
      const request = { json: vi.fn().mockResolvedValue({ name: 'Test', riskScore: 0 }) };
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Perfil de risco inválido. Deve ser entre 1 e 5.' });
    });

    it('should return 400 if riskScore is invalid (greater than 5)', async () => {
      const { POST } = await import('../src/app/api/profile/route');
      const request = { json: vi.fn().mockResolvedValue({ name: 'Test', riskScore: 6 }) };
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Perfil de risco inválido. Deve ser entre 1 e 5.' });
    });

    it('should return 500 if database operation fails', async () => {
      const { POST } = await import('../src/app/api/profile/route');
      mockCreateOrUpdateProfile.mockRejectedValue(new Error('Database error'));
      const request = { json: vi.fn().mockResolvedValue({ name: 'Test', riskScore: 3 }) };
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao salvar perfil: Database error' });
    });
  });

  // --- /api/pdf Tests ---
  describe('/api/pdf', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetAuth.mockReturnValue({ userId: null });
      const { POST } = await import('../src/app/api/pdf/route');
      const request = { json: vi.fn().mockResolvedValue({ portfolio: {} }) };
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should generate PDF and return URL successfully', async () => {
      const { POST } = await import('../src/app/api/pdf/route');
      const mockPortfolio = { weights: { VTI: 0.7, BND: 0.3 }, metrics: {} };
      const mockPdfBytes = new Uint8Array([1, 2, 3]);
      const mockUploadResponse = { data: { path: 'user_test_123/portfolio_report_12345.pdf' }, error: null };
      const expectedPublicUrl = `SUPABASE_URL/storage/v1/object/public/portfolio-pdfs/${mockUploadResponse.data.path}`; // Construct expected URL based on how it's built in the route

      (generatePdf as any).mockResolvedValue(mockPdfBytes);
      mockUpload.mockResolvedValue(mockUploadResponse);
      // Mock createClient to return the correct URL needed for constructing the public URL
      (createClient as any).mockReturnValue({ 
        storage: { from: mockStorageFrom },
        // Mock the part that gives the base URL for storage
        functions: { getUrl: () => 'SUPABASE_URL/storage/v1' } // Simplified mock
      });

      const request = { json: vi.fn().mockResolvedValue({ portfolio: mockPortfolio }) };
      await POST(request as any);

      expect(generatePdf).toHaveBeenCalledWith(mockPortfolio);
      expect(mockStorageFrom).toHaveBeenCalledWith('portfolio-pdfs');
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining(`user_test_123/portfolio_report_`),
        mockPdfBytes,
        { contentType: 'application/pdf', upsert: true }
      );
      expect(mockJson).toHaveBeenCalledWith({ pdfUrl: expect.stringContaining('portfolio_report_') }); // Check if URL is returned
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 if portfolio data is missing', async () => {
      const { POST } = await import('../src/app/api/pdf/route');
      const request = { json: vi.fn().mockResolvedValue({}) }; // Missing portfolio
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Dados do portfólio são obrigatórios.' });
    });

    it('should return 500 if PDF generation fails', async () => {
      const { POST } = await import('../src/app/api/pdf/route');
      (generatePdf as any).mockRejectedValue(new Error('PDF generation failed'));
      const request = { json: vi.fn().mockResolvedValue({ portfolio: {} }) };
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao gerar PDF: PDF generation failed' });
    });

    it('should return 500 if Supabase upload fails', async () => {
      const { POST } = await import('../src/app/api/pdf/route');
      const mockPdfBytes = new Uint8Array([1, 2, 3]);
      const mockUploadError = { data: null, error: new Error('Upload failed') };

      (generatePdf as any).mockResolvedValue(mockPdfBytes);
      mockUpload.mockResolvedValue(mockUploadError); // Simulate upload error

      const request = { json: vi.fn().mockResolvedValue({ portfolio: {} }) };
      await POST(request as any);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao fazer upload do PDF: Upload failed' });
    });
  });

  // --- /api/subscription Tests ---
  describe('/api/subscription', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetAuth.mockReturnValue({ userId: null });
      const { POST } = await import('../src/app/api/subscription/route');
      const request = { json: vi.fn().mockResolvedValue({}) }; // Empty body
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 404 if user profile is not found', async () => {
      mockGetProfileById.mockResolvedValue(null); // Simulate profile not found
      const { POST } = await import('../src/app/api/subscription/route');
      const request = { json: vi.fn().mockResolvedValue({}) };
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Perfil do usuário não encontrado.' });
    });

    it('should create Mercado Pago preference and return init_point', async () => {
      const mockProfile = { id: 'user_test_123', name: 'Test User', email: 'test@example.com', riskScore: 3, subscriptionStatus: 'inactive' };
      const mockPreference = { id: 'pref_123', init_point: 'https://mercadopago.com/checkout/...' };
      mockGetProfileById.mockResolvedValue(mockProfile);
      mockPreferenceCreate.mockResolvedValue(mockPreference);

      const { POST } = await import('../src/app/api/subscription/route');
      const request = { json: vi.fn().mockResolvedValue({}) };
      await POST(request as any);

      expect(mockGetProfileById).toHaveBeenCalledWith('user_test_123');
      expect(mockPreferenceCreate).toHaveBeenCalledWith(expect.objectContaining({
        items: expect.arrayContaining([expect.objectContaining({ title: 'Assinatura Premium Robo-ETF' })]),
        payer: expect.objectContaining({ email: mockProfile.email }),
        external_reference: 'user_test_123',
      }));
      expect(mockJson).toHaveBeenCalledWith({ preferenceId: 'pref_123', init_point: mockPreference.init_point });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 500 if getting profile fails', async () => {
      mockGetProfileById.mockRejectedValue(new Error('DB error getting profile'));
      const { POST } = await import('../src/app/api/subscription/route');
      const request = { json: vi.fn().mockResolvedValue({}) };
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao buscar perfil do usuário: DB error getting profile' });
    });

    it('should return 500 if Mercado Pago preference creation fails', async () => {
      const mockProfile = { id: 'user_test_123', name: 'Test User', email: 'test@example.com', riskScore: 3, subscriptionStatus: 'inactive' };
      mockGetProfileById.mockResolvedValue(mockProfile);
      mockPreferenceCreate.mockRejectedValue(new Error('MP API error')); // Simulate MP error

      const { POST } = await import('../src/app/api/subscription/route');
      const request = { json: vi.fn().mockResolvedValue({}) };
      await POST(request as any);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao criar preferência de pagamento: MP API error' });
    });
  });

  // --- /api/mercadopago/webhook Tests ---
  describe('/api/mercadopago/webhook', () => {
    it('should return 400 if request body is invalid (missing type)', async () => {
      const { POST } = await import('../src/app/api/mercadopago/webhook/route');
      const request = { json: vi.fn().mockResolvedValue({ action: 'payment.updated', data: { id: '123' } }) }; // Missing type
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Tipo de notificação inválido ou dados ausentes.' });
    });

    it('should return 400 if request body is invalid (missing data.id)', async () => {
      const { POST } = await import('../src/app/api/mercadopago/webhook/route');
      const request = { json: vi.fn().mockResolvedValue({ type: 'payment', action: 'payment.updated', data: {} }) }; // Missing data.id
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Tipo de notificação inválido ou dados ausentes.' });
    });

    it('should ignore notification if type is not payment', async () => {
      const { POST } = await import('../src/app/api/mercadopago/webhook/route');
      const request = { json: vi.fn().mockResolvedValue({ type: 'plan', action: 'plan.updated', data: { id: '123' } }) };
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ received: true, message: 'Notificação ignorada (não é de pagamento).' });
      expect(mockPaymentFindById).not.toHaveBeenCalled();
      expect(mockUpdateSubscriptionStatus).not.toHaveBeenCalled();
    });

    it('should process approved payment and update subscription status', async () => {
      const { POST } = await import('../src/app/api/mercadopago/webhook/route');
      const paymentId = 'pay_12345';
      const userId = 'user_from_ref';
      const mockPaymentData = { id: paymentId, status: 'approved', external_reference: userId };
      mockPaymentFindById.mockResolvedValue(mockPaymentData);
      mockUpdateSubscriptionStatus.mockResolvedValue({ id: userId, subscriptionStatus: 'active' });

      const request = { json: vi.fn().mockResolvedValue({ type: 'payment', action: 'payment.updated', data: { id: paymentId } }) };
      await POST(request as any);

      expect(mockPaymentFindById).toHaveBeenCalledWith(paymentId);
      expect(mockUpdateSubscriptionStatus).toHaveBeenCalledWith(userId, 'active');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ received: true, status: 'processed' });
    });

    it('should process non-approved payment and update subscription status to inactive', async () => {
      const { POST } = await import('../src/app/api/mercadopago/webhook/route');
      const paymentId = 'pay_67890';
      const userId = 'user_other_ref';
      const mockPaymentData = { id: paymentId, status: 'rejected', external_reference: userId }; // Rejected status
      mockPaymentFindById.mockResolvedValue(mockPaymentData);
      mockUpdateSubscriptionStatus.mockResolvedValue({ id: userId, subscriptionStatus: 'inactive' });

      const request = { json: vi.fn().mockResolvedValue({ type: 'payment', action: 'payment.updated', data: { id: paymentId } }) };
      await POST(request as any);

      expect(mockPaymentFindById).toHaveBeenCalledWith(paymentId);
      expect(mockUpdateSubscriptionStatus).toHaveBeenCalledWith(userId, 'inactive');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({ received: true, status: 'processed' });
    });

     it('should return 404 if payment not found in Mercado Pago', async () => {
      const { POST } = await import('../src/app/api/mercadopago/webhook/route');
      const paymentId = 'pay_not_found';
      mockPaymentFindById.mockResolvedValue(null); // Simulate payment not found

      const request = { json: vi.fn().mockResolvedValue({ type: 'payment', action: 'payment.updated', data: { id: paymentId } }) };
      await POST(request as any);

      expect(mockPaymentFindById).toHaveBeenCalledWith(paymentId);
      expect(mockUpdateSubscriptionStatus).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Pagamento não encontrado no Mercado Pago.' });
    });

    it('should return 500 if fetching payment from Mercado Pago fails', async () => {
      const { POST } = await import('../src/app/api/mercadopago/webhook/route');
      const paymentId = 'pay_error';
      mockPaymentFindById.mockRejectedValue(new Error('MP API fetch error')); // Simulate MP API error

      const request = { json: vi.fn().mockResolvedValue({ type: 'payment', action: 'payment.updated', data: { id: paymentId } }) };
      await POST(request as any);

      expect(mockPaymentFindById).toHaveBeenCalledWith(paymentId);
      expect(mockUpdateSubscriptionStatus).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao buscar pagamento no Mercado Pago: MP API fetch error' });
    });

    it('should return 500 if updating database fails', async () => {
      const { POST } = await import('../src/app/api/mercadopago/webhook/route');
      const paymentId = 'pay_db_error';
      const userId = 'user_db_error';
      const mockPaymentData = { id: paymentId, status: 'approved', external_reference: userId };
      mockPaymentFindById.mockResolvedValue(mockPaymentData);
      mockUpdateSubscriptionStatus.mockRejectedValue(new Error('DB update error')); // Simulate DB error

      const request = { json: vi.fn().mockResolvedValue({ type: 'payment', action: 'payment.updated', data: { id: paymentId } }) };
      await POST(request as any);

      expect(mockPaymentFindById).toHaveBeenCalledWith(paymentId);
      expect(mockUpdateSubscriptionStatus).toHaveBeenCalledWith(userId, 'active');
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao atualizar status da assinatura: DB update error' });
    });
  });

  // --- /api/chat Tests ---
  describe('/api/chat', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetAuth.mockReturnValue({ userId: null });
      const { POST } = await import('../src/app/api/chat/route');
      const request = { json: vi.fn().mockResolvedValue({ messages: [{ role: 'user', content: 'Hello' }] }) };
      await POST(request as any);
      // For non-streaming, check status and json
      // Since it uses StreamingTextResponse, we check if the mocked constructor was called with an error or specific status
      // Or, more simply, check if getChatCompletion was NOT called
      expect(mockGetChatCompletion).not.toHaveBeenCalled();
      // We can't easily check the status code of StreamingTextResponse without more complex mocking
      // But we know it shouldn't proceed if unauthorized.
    });

    it('should return 400 if messages are missing or empty', async () => {
      const { POST } = await import('../src/app/api/chat/route');
      const request = { json: vi.fn().mockResolvedValue({ messages: [] }) }; // Empty messages
      await POST(request as any);
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Messages are required' });
    });

    it('should call getChatCompletion and return StreamingTextResponse on success', async () => {
      const { POST } = await import('../src/app/api/chat/route');
      const mockMessages = [{ role: 'user', content: 'Tell me about VOO' }];
      const mockStream = new ReadableStream(); // Mock a stream
      mockGetChatCompletion.mockResolvedValue(mockStream); // Assume getChatCompletion returns a stream-like object

      const request = { json: vi.fn().mockResolvedValue({ messages: mockMessages }) };
      await POST(request as any);

      expect(mockGetAuth).toHaveBeenCalled();
      expect(mockGetChatCompletion).toHaveBeenCalledWith(mockMessages);
      expect(OpenAIStream).toHaveBeenCalledWith(mockStream);
      expect(StreamingTextResponse).toHaveBeenCalled();
    });

    it('should return 500 if getChatCompletion fails', async () => {
      const { POST } = await import('../src/app/api/chat/route');
      const mockMessages = [{ role: 'user', content: 'Error case' }];
      mockGetChatCompletion.mockRejectedValue(new Error('OpenAI API error')); // Simulate failure

      const request = { json: vi.fn().mockResolvedValue({ messages: mockMessages }) };
      await POST(request as any);

      expect(mockGetChatCompletion).toHaveBeenCalledWith(mockMessages);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });

  // --- /api/cron/* Tests ---
  describe('/api/cron/*', () => {
    const validApiKey = 'test-cron-key';

    // Test Rebalance Route
    describe('/api/cron/rebalance', () => {
      it('should return 401 if Authorization header is missing', async () => {
        const { GET } = await import('../src/app/api/cron/rebalance/route');
        const request = { headers: { get: vi.fn().mockReturnValue(null) } };
        await GET(request as any);
        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
        expect(mockRebalancePortfolios).not.toHaveBeenCalled();
      });

      it('should return 401 if Authorization header is invalid (no Bearer)', async () => {
        const { GET } = await import('../src/app/api/cron/rebalance/route');
        const request = { headers: { get: vi.fn().mockReturnValue('invalid-key') } };
        await GET(request as any);
        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
        expect(mockRebalancePortfolios).not.toHaveBeenCalled();
      });

      it('should return 401 if Authorization header has wrong key', async () => {
        const { GET } = await import('../src/app/api/cron/rebalance/route');
        const request = { headers: { get: vi.fn().mockReturnValue('Bearer wrong-key') } };
        await GET(request as any);
        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
        expect(mockRebalancePortfolios).not.toHaveBeenCalled();
      });

      it('should return 200 and call rebalancePortfolios if Authorization header is valid', async () => {
        const { GET } = await import('../src/app/api/cron/rebalance/route');
        const request = { headers: { get: vi.fn().mockReturnValue(`Bearer ${validApiKey}`) } };
        mockRebalancePortfolios.mockResolvedValue({ success: true, count: 5 }); // Simulate success
        await GET(request as any);
        expect(mockRebalancePortfolios).toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith({ success: true, message: 'Rebalance job executed.', count: 5 });
      });

      it('should return 500 if rebalancePortfolios fails', async () => {
        const { GET } = await import('../src/app/api/cron/rebalance/route');
        const request = { headers: { get: vi.fn().mockReturnValue(`Bearer ${validApiKey}`) } };
        mockRebalancePortfolios.mockRejectedValue(new Error('Rebalance failed')); // Simulate error
        await GET(request as any);
        expect(mockRebalancePortfolios).toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao executar rebalanceamento: Rebalance failed' });
      });
    });

    // Test Drawdown Route
    describe('/api/cron/drawdown', () => {
       it('should return 401 if Authorization header is missing', async () => {
        const { GET } = await import('../src/app/api/cron/drawdown/route');
        const request = { headers: { get: vi.fn().mockReturnValue(null) } };
        await GET(request as any);
        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
        expect(mockCheckDrawdown).not.toHaveBeenCalled();
      });

      it('should return 401 if Authorization header is invalid (no Bearer)', async () => {
        const { GET } = await import('../src/app/api/cron/drawdown/route');
        const request = { headers: { get: vi.fn().mockReturnValue('invalid-key') } };
        await GET(request as any);
        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
        expect(mockCheckDrawdown).not.toHaveBeenCalled();
      });

      it('should return 401 if Authorization header has wrong key', async () => {
        const { GET } = await import('../src/app/api/cron/drawdown/route');
        const request = { headers: { get: vi.fn().mockReturnValue('Bearer wrong-key') } };
        await GET(request as any);
        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Unauthorized' });
        expect(mockCheckDrawdown).not.toHaveBeenCalled();
      });

      it('should return 200 and call checkDrawdown if Authorization header is valid', async () => {
        const { GET } = await import('../src/app/api/cron/drawdown/route');
        const request = { headers: { get: vi.fn().mockReturnValue(`Bearer ${validApiKey}`) } };
        mockCheckDrawdown.mockResolvedValue({ success: true, checked: 10 }); // Simulate success
        await GET(request as any);
        expect(mockCheckDrawdown).toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith({ success: true, message: 'Drawdown check executed.', checked: 10 });
      });

      it('should return 500 if checkDrawdown fails', async () => {
        const { GET } = await import('../src/app/api/cron/drawdown/route');
        const request = { headers: { get: vi.fn().mockReturnValue(`Bearer ${validApiKey}`) } };
        mockCheckDrawdown.mockRejectedValue(new Error('Drawdown check failed')); // Simulate error
        await GET(request as any);
        expect(mockCheckDrawdown).toHaveBeenCalled();
        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({ error: 'Erro ao executar verificação de drawdown: Drawdown check failed' });
      });
    });
  });
});

