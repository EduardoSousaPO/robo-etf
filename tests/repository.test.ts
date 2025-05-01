import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { 
  getProfileById, 
  createOrUpdateProfile, 
  getPortfoliosByUserId, 
  createPortfolio 
} from '../src/lib/repository';

// Mock Prisma Client
const mockPrisma = {
  profile: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  portfolio: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma),
}));

// Mock the db instance used in repository.ts
vi.mock('../src/lib/db', () => ({
  default: mockPrisma, // Use the mocked prisma instance
}));

describe('Prisma Repository Functions', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
  });

  // --- Tests for getProfileById ---
  it('getProfileById should return profile if found', async () => {
    const mockProfile = { id: 'user_123', name: 'Test User', riskScore: 3, subscriptionStatus: 'active' };
    mockPrisma.profile.findUnique.mockResolvedValue(mockProfile);

    const profile = await getProfileById('user_123');

    expect(mockPrisma.profile.findUnique).toHaveBeenCalledWith({ where: { id: 'user_123' } });
    expect(profile).toEqual(mockProfile);
  });

  it('getProfileById should return null if profile not found', async () => {
    mockPrisma.profile.findUnique.mockResolvedValue(null);

    const profile = await getProfileById('user_not_found');

    expect(mockPrisma.profile.findUnique).toHaveBeenCalledWith({ where: { id: 'user_not_found' } });
    expect(profile).toBeNull();
  });

  // --- Tests for createOrUpdateProfile ---
  it('createOrUpdateProfile should call upsert with correct data', async () => {
    const profileData = { id: 'user_456', name: 'New User', riskScore: 4 };
    const mockUpsertedProfile = { ...profileData, subscriptionStatus: 'inactive' }; // Example response
    mockPrisma.profile.upsert.mockResolvedValue(mockUpsertedProfile);

    const profile = await createOrUpdateProfile(profileData.id, profileData.name, profileData.riskScore);

    expect(mockPrisma.profile.upsert).toHaveBeenCalledWith({
      where: { id: profileData.id },
      update: { name: profileData.name, riskScore: profileData.riskScore },
      create: { id: profileData.id, name: profileData.name, riskScore: profileData.riskScore },
    });
    expect(profile).toEqual(mockUpsertedProfile);
  });

   it('createOrUpdateProfile should handle optional subscriptionStatus', async () => {
    const profileData = { id: 'user_789', name: 'Updated User', riskScore: 2, subscriptionStatus: 'active' as const };
    const mockUpsertedProfile = { ...profileData };
    mockPrisma.profile.upsert.mockResolvedValue(mockUpsertedProfile);

    const profile = await createOrUpdateProfile(profileData.id, profileData.name, profileData.riskScore, profileData.subscriptionStatus);

    expect(mockPrisma.profile.upsert).toHaveBeenCalledWith({
      where: { id: profileData.id },
      update: { name: profileData.name, riskScore: profileData.riskScore, subscriptionStatus: profileData.subscriptionStatus },
      create: { id: profileData.id, name: profileData.name, riskScore: profileData.riskScore, subscriptionStatus: profileData.subscriptionStatus },
    });
    expect(profile).toEqual(mockUpsertedProfile);
  });

  // --- Tests for getPortfoliosByUserId ---
  it('getPortfoliosByUserId should return portfolios for a user', async () => {
    const mockPortfolios = [
      { id: 'p1', userId: 'user_abc', riskScore: 3, weights: { VTI: 0.5, IEI: 0.5 }, metrics: {}, createdAt: new Date() },
      { id: 'p2', userId: 'user_abc', riskScore: 3, weights: { SPY: 0.6, BND: 0.4 }, metrics: {}, createdAt: new Date() },
    ];
    mockPrisma.portfolio.findMany.mockResolvedValue(mockPortfolios);

    const portfolios = await getPortfoliosByUserId('user_abc');

    expect(mockPrisma.portfolio.findMany).toHaveBeenCalledWith({
      where: { userId: 'user_abc' },
      orderBy: { createdAt: 'desc' },
    });
    expect(portfolios).toEqual(mockPortfolios);
  });

  it('getPortfoliosByUserId should return empty array if no portfolios found', async () => {
    mockPrisma.portfolio.findMany.mockResolvedValue([]);

    const portfolios = await getPortfoliosByUserId('user_xyz');

    expect(mockPrisma.portfolio.findMany).toHaveBeenCalledWith({
      where: { userId: 'user_xyz' },
      orderBy: { createdAt: 'desc' },
    });
    expect(portfolios).toEqual([]);
  });

  // --- Tests for createPortfolio ---
  it('createPortfolio should call create with correct data', async () => {
    const portfolioData = {
      userId: 'user_def',
      riskScore: 4,
      weights: { VOO: 0.7, BNDX: 0.3 },
      metrics: { return: 0.1, volatility: 0.15, sharpe: 0.6 },
    };
    const mockCreatedPortfolio = { ...portfolioData, id: 'p3', createdAt: new Date() }; // Example response
    mockPrisma.portfolio.create.mockResolvedValue(mockCreatedPortfolio);

    const portfolio = await createPortfolio(portfolioData.userId, portfolioData.riskScore, portfolioData.weights, portfolioData.metrics);

    expect(mockPrisma.portfolio.create).toHaveBeenCalledWith({
      data: {
        userId: portfolioData.userId,
        riskScore: portfolioData.riskScore,
        weights: portfolioData.weights,
        metrics: portfolioData.metrics,
      },
    });
    expect(portfolio).toEqual(mockCreatedPortfolio);
  });
});

