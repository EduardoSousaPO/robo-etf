/**
 * Integração com APIs oficiais do Yahoo Finance
 */

// Tipos para as respostas das APIs do Yahoo Finance
export interface YahooStockChart {
  prices: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    adjClose?: number;
    volume: number;
  }[];
  isPending?: boolean;
}

export interface YahooStockHolder {
  name: string;
  percentage: number;
  date: string;
}

export interface YahooStockHolders {
  institutionalHolders: YahooStockHolder[];
  fundHolders: YahooStockHolder[];
}

export interface YahooStockInsight {
  rating: string;
  targetPrice: number;
  recommendation: string;
  analystCount: number;
}

export interface YahooETF {
  symbol: string;
  name: string;
  price: number;
  change: number;
  exchange: string;
  volume: number;
}

export interface YahooETFHolding {
  asset: string;
  name: string;
  weight: number;
  sector?: string;
  country?: string;
}

// Tipos para as respostas de API
interface YahooChartResponse {
  chart?: {
    result?: Array<{
      timestamp: number[];
      indicators: {
        quote: Array<{
          open?: number[];
          high?: number[];
          low?: number[];
          close?: number[];
          volume?: number[];
        }>;
        adjclose?: Array<{
          adjclose?: number[];
        }>;
      };
    }>;
    error?: {
      code: string;
      description: string;
    };
  };
}

interface YahooQuoteSummaryResponse {
  quoteSummary?: {
    result?: Array<{
      institutionOwnership?: {
        ownershipList: Array<{
          organization: string;
          pctHeld: { raw: number };
          reportDate: { raw: number };
        }>;
      };
      fundOwnership?: {
        ownershipList: Array<{
          organization: string;
          pctHeld: { raw: number };
          reportDate: { raw: number };
        }>;
      };
      financialData?: {
        recommendationKey?: string;
        targetMeanPrice?: { raw: number };
        recommendationMean?: { raw: number };
        numberOfAnalystOpinions?: { raw: number };
      };
      topHoldings?: {
        holdings: Array<{
          symbol: string;
          holdingName: string;
          holdingPercent: { raw: number };
          sector?: string;
        }>;
      };
    }>;
    error?: {
      code: string;
      description: string;
    };
  };
}

interface YahooQuoteResponse {
  quoteResponse?: {
    result?: Array<{
      symbol: string;
      longName?: string;
      shortName?: string;
      regularMarketPrice?: number;
      regularMarketChangePercent?: number;
      fullExchangeName?: string;
      regularMarketVolume?: number;
    }>;
    error?: {
      code: string;
      description: string;
    };
  };
}

// Cache simples para armazenar respostas da API por 15 minutos
const cacheOfficial: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION_OFFICIAL = 15 * 60 * 1000; // 15 minutos

// Função para obter dados do cache
function getCachedDataOfficial(key: string): any | null {
  const cached = cacheOfficial[key];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_OFFICIAL) {
    console.log(`Usando cache para: ${key}`);
    return cached.data;
  }
  return null;
}

// Função para armazenar dados no cache
function setCachedDataOfficial(key: string, data: any): void {
  cacheOfficial[key] = {
    data,
    timestamp: Date.now()
  };
}

// Função para obter dados de gráfico de ações
export async function getStockChart(
  symbol: string, 
  range: string = '1mo', 
  interval: string = '1d'
): Promise<YahooStockChart | null> {
  const cacheKey = `chart_${symbol}_${range}_${interval}`;
  const cached = getCachedDataOfficial(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}&includePrePost=false`;
    console.log(`Buscando gráfico para ${symbol} com range ${range} do Yahoo Finance...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    if (!response.ok) {
      console.warn(`Erro ao buscar gráfico para ${symbol}: HTTP ${response.status}`);
      return null;
    }
    
    const data = await response.json() as YahooChartResponse;
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      console.error(`Dados inválidos retornados para ${symbol}`);
      return null;
    }
    
    const result = data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quote = result.indicators.quote[0] || {};
    const adjclose = result.indicators.adjclose?.[0]?.adjclose || [];
    
    const prices = timestamps.map((timestamp: number, i: number) => {
      const date = new Date(timestamp * 1000).toISOString().split('T')[0];
      return {
        date,
        open: quote.open?.[i] || 0,
        high: quote.high?.[i] || 0,
        low: quote.low?.[i] || 0,
        close: quote.close?.[i] || 0,
        adjClose: adjclose[i] || quote.close?.[i] || 0,
        volume: quote.volume?.[i] || 0
      };
    });
    
    const chartData: YahooStockChart = { prices };
    setCachedDataOfficial(cacheKey, chartData);
    return chartData;
  } catch (error) {
    console.error(`Erro ao obter gráfico para ${symbol}:`, error);
    return null;
  }
}

// Função para obter detentores de ações
export async function getStockHolders(symbol: string): Promise<YahooStockHolders | null> {
  const cacheKey = `holders_${symbol}`;
  const cached = getCachedDataOfficial(cacheKey);
  if (cached) return cached;

  try {
    // Usando módulo de holders do Yahoo Finance
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=institutionOwnership,fundOwnership`;
    console.log(`Buscando detentores para ${symbol} do Yahoo Finance...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    if (!response.ok) {
      console.warn(`Erro ao buscar detentores para ${symbol}: HTTP ${response.status}`);
      return null;
    }
    
    const data = await response.json() as YahooQuoteSummaryResponse;
    
    if (!data.quoteSummary || !data.quoteSummary.result || data.quoteSummary.result.length === 0) {
      console.error(`Dados inválidos retornados para ${symbol}`);
      return null;
    }
    
    const result = data.quoteSummary.result[0];
    
    const institutionalHolders = (result.institutionOwnership?.ownershipList || []).map((holder) => ({
      name: holder.organization,
      percentage: holder.pctHeld.raw * 100,
      date: new Date(holder.reportDate.raw * 1000).toISOString().split('T')[0]
    }));
    
    const fundHolders = (result.fundOwnership?.ownershipList || []).map((holder) => ({
      name: holder.organization,
      percentage: holder.pctHeld.raw * 100,
      date: new Date(holder.reportDate.raw * 1000).toISOString().split('T')[0]
    }));
    
    const holdersData: YahooStockHolders = {
      institutionalHolders,
      fundHolders
    };
    
    setCachedDataOfficial(cacheKey, holdersData);
    return holdersData;
  } catch (error) {
    console.error(`Erro ao obter detentores para ${symbol}:`, error);
    return null;
  }
}

// Função para obter insights sobre ações
export async function getStockInsights(symbol: string): Promise<YahooStockInsight | null> {
  const cacheKey = `insights_${symbol}`;
  const cached = getCachedDataOfficial(cacheKey);
  if (cached) return cached;

  try {
    // Usando módulo de recomendações do Yahoo Finance
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=recommendationTrend,financialData`;
    console.log(`Buscando insights para ${symbol} do Yahoo Finance...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    if (!response.ok) {
      console.warn(`Erro ao buscar insights para ${symbol}: HTTP ${response.status}`);
      return null;
    }
    
    const data = await response.json() as YahooQuoteSummaryResponse;
    
    if (!data.quoteSummary || !data.quoteSummary.result || data.quoteSummary.result.length === 0) {
      console.error(`Dados inválidos retornados para ${symbol}`);
      return null;
    }
    
    const result = data.quoteSummary.result[0];
    
    // Extrair recomendações e dados financeiros
    const financialData = result.financialData || {};
    
    const insightData: YahooStockInsight = {
      rating: financialData.recommendationKey || 'N/A',
      targetPrice: financialData.targetMeanPrice?.raw || 0,
      recommendation: getRecommendationText(financialData.recommendationMean?.raw || 0),
      analystCount: financialData.numberOfAnalystOpinions?.raw || 0
    };
    
    setCachedDataOfficial(cacheKey, insightData);
    return insightData;
  } catch (error) {
    console.error(`Erro ao obter insights para ${symbol}:`, error);
    return null;
  }
}

// Função para obter as holdings (componentes) de um ETF
export async function getETFHoldings(symbol: string): Promise<YahooETFHolding[]> {
  const cacheKey = `etf_holdings_${symbol}`;
  const cached = getCachedDataOfficial(cacheKey);
  if (cached) return cached;

  try {
    // Usando módulo topHoldings do Yahoo Finance
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=topHoldings`;
    console.log(`Buscando holdings para ETF ${symbol} do Yahoo Finance...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    if (!response.ok) {
      console.warn(`Erro ao buscar holdings para ${symbol}: HTTP ${response.status}`);
      return [];
    }
    
    const data = await response.json() as YahooQuoteSummaryResponse;
    
    if (!data.quoteSummary?.result?.[0]?.topHoldings?.holdings) {
      console.error(`Dados de holdings não encontrados para ${symbol}`);
      return [];
    }
    
    const holdings = data.quoteSummary.result[0].topHoldings.holdings.map(holding => ({
      asset: holding.symbol,
      name: holding.holdingName,
      weight: holding.holdingPercent.raw * 100,
      sector: holding.sector || 'N/A',
      country: 'N/A' // Yahoo não fornece país diretamente
    }));
    
    setCachedDataOfficial(cacheKey, holdings);
    return holdings;
  } catch (error) {
    console.error(`Erro ao obter holdings para ETF ${symbol}:`, error);
    return [];
  }
}

// Função auxiliar para categorizar a recomendação
function getRecommendationText(value: number): string {
  if (value <= 1.5) return 'Forte Compra';
  if (value <= 2.5) return 'Compra';
  if (value <= 3.5) return 'Manter';
  if (value <= 4.5) return 'Venda';
  return 'Forte Venda';
}

// Lista de ETFs populares por categoria
const popularETFs: Record<string, string[]> = {
  'US Equity': ['SPY', 'VOO', 'VTI', 'QQQ', 'IVV', 'ITOT', 'SCHB', 'DIA', 'RSP', 'SPLG'],
  'International Equity': ['VXUS', 'EFA', 'VEA', 'IEFA', 'EEM', 'VWO', 'IXUS', 'SCHF', 'IEMG', 'SPDW'],
  'Fixed Income': ['AGG', 'BND', 'VCIT', 'VCSH', 'LQD', 'MBB', 'VTIP', 'TIP', 'SCHP', 'BNDX'],
  'Sector': ['XLF', 'XLV', 'XLE', 'XLK', 'XLI', 'XLU', 'XLY', 'XLP', 'XLB', 'XLRE'],
  'Commodity': ['GLD', 'IAU', 'SLV', 'USO', 'DBC', 'PDBC', 'COMT', 'GSG', 'GDX', 'BCI'],
  'Dividend': ['VYM', 'SCHD', 'HDV', 'DVY', 'SPHD', 'SPYD', 'DGRO', 'DGRW', 'SDY', 'VIG'],
  'Growth': ['VUG', 'IWF', 'SCHG', 'VONG', 'SPYG', 'IWO', 'VBK', 'IUSG', 'RPG', 'FTC'],
  'Value': ['VTV', 'IWD', 'SCHV', 'VONV', 'SPYV', 'IWN', 'VBR', 'IUSV', 'RPV', 'FTA'],
  'Volatility': ['SPLV', 'USMV', 'LVHD', 'EFAV', 'SPHQ', 'ACWV', 'VFMV', 'LGLV', 'XSLV', 'XMLV']
};

// Função para obter ETFs por categoria
export async function getETFsByCategory(): Promise<YahooETF[]> {
  const etfs: YahooETF[] = [];
  
  try {
    // Para cada categoria, obter cotações para seus ETFs
    for (const [category, symbols] of Object.entries(popularETFs)) {
      const quotes = await getETFQuotes(symbols);
      if (quotes && quotes.length > 0) {
        etfs.push(...quotes);
      }
    }
    
    // Ordenar por volume e retornar os top 80 ETFs
    return etfs
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 80);
  } catch (error) {
    console.error('Erro ao obter ETFs por categoria:', error);
    return [];
  }
}

// Função pública para obter cotações de ETFs
export async function getETFQuotes(symbols: string[]): Promise<YahooETF[]> {
  if (!symbols || symbols.length === 0) return [];
  
  const symbolsStr = symbols.join(',');
  const cacheKey = `quotes_${symbolsStr}`;
  const cached = getCachedDataOfficial(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsStr}`;
    console.log(`Buscando cotações para ${symbols.length} ETFs do Yahoo Finance...`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    if (!response.ok) {
      console.warn(`Erro ao buscar cotações para ${symbols.length} ETFs: HTTP ${response.status}`);
      return [];
    }
    
    const data = await response.json() as YahooQuoteResponse;
    
    if (!data.quoteResponse?.result) {
      console.error('Dados inválidos retornados para cotações de ETFs');
      return [];
    }
    
    const quotes: YahooETF[] = data.quoteResponse.result.map((quote) => ({
      symbol: quote.symbol,
      name: quote.longName || quote.shortName || quote.symbol,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChangePercent || 0,
      exchange: quote.fullExchangeName || '',
      volume: quote.regularMarketVolume || 0
    }));
    
    setCachedDataOfficial(cacheKey, quotes);
    return quotes;
  } catch (error) {
    console.error(`Erro ao obter cotações para ${symbols.length} ETFs:`, error);
    return [];
  }
}

// Função para obter lista completa de ETFs
export async function getETFList(): Promise<YahooETF[]> {
  // Primeiro tenta buscar os ETFs por categoria, que já inclui os mais populares
  const etfs = await getETFsByCategory();
  
  // Se tivermos um bom número de ETFs, retornamos diretamente
  if (etfs.length >= 50) {
    return etfs;
  }
  
  // Caso contrário, retorna uma lista de ETFs populares conhecidos
  const allPopularSymbols = Object.values(popularETFs).flat();
  const uniqueSymbols = [...new Set(allPopularSymbols)];
  
  return getETFQuotes(uniqueSymbols);
} 