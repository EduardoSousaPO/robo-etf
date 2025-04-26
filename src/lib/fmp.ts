import { FMP_API_KEY } from '@/lib/constants';

// Tipos para os dados da API FMP
export type ETF = {
  symbol: string;
  name: string;
  price: number;
  exchange: string;
  exchangeShortName: string;
  type: string;
};

export type ETFHolding = {
  asset: string;
  name: string;
  weight: number;
  sector: string;
  country: string;
};

export type ETFQuote = {
  symbol: string;
  price: number;
  beta: number;
  changesPercentage: number;
  change: number;
  volume: number;
};

export type HistoricalPrice = {
  date: string;
  close: number;
};

// Cache para armazenar dados temporariamente (15 minutos)
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutos em milissegundos

// Função para verificar se o cache é válido
function isCacheValid(key: string): boolean {
  if (!cache[key]) return false;
  return Date.now() - cache[key].timestamp < CACHE_DURATION;
}

// Função para obter dados do cache ou da API
async function fetchWithCache<T>(
  url: string,
  cacheKey: string
): Promise<T> {
  // Verificar se há dados válidos no cache
  if (isCacheValid(cacheKey)) {
    return cache[cacheKey].data as T;
  }

  // Buscar dados da API
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Erro na API FMP: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Armazenar no cache
  cache[cacheKey] = {
    data,
    timestamp: Date.now(),
  };
  
  return data as T;
}

// Função para listar todos os ETFs disponíveis
export async function getETFList(): Promise<ETF[]> {
  const url = `https://financialmodelingprep.com/api/v3/etf/list?apikey=${FMP_API_KEY}`;
  return fetchWithCache<ETF[]>(url, 'etf_list');
}

// Função para obter as holdings de um ETF específico
export async function getETFHoldings(symbol: string): Promise<ETFHolding[]> {
  const url = `https://financialmodelingprep.com/api/v3/etf/holdings/${symbol}?apikey=${FMP_API_KEY}`;
  return fetchWithCache<ETFHolding[]>(url, `holdings_${symbol}`);
}

// Função para obter cotações de ETFs
export async function getETFQuotes(symbols: string[]): Promise<ETFQuote[]> {
  const symbolsStr = symbols.join(',');
  const url = `https://financialmodelingprep.com/api/v3/quote/${symbolsStr}?apikey=${FMP_API_KEY}`;
  return fetchWithCache<ETFQuote[]>(url, `quotes_${symbolsStr}`);
}

// Função para obter preços históricos de um ETF
export async function getHistoricalPrices(
  symbol: string,
  from: string,
  to: string
): Promise<HistoricalPrice[]> {
  const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?from=${from}&to=${to}&apikey=${FMP_API_KEY}`;
  const cacheKey = `historical_${symbol}_${from}_${to}`;
  
  const response = await fetchWithCache<{ historical: HistoricalPrice[] }>(url, cacheKey);
  return response.historical;
}

// Função de fallback com ETFs populares
function getFallbackETFs(): ETF[] {
  return [
    { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', price: 250.0, exchange: 'NYSE', exchangeShortName: 'NYSE', type: 'ETF' },
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', price: 430.0, exchange: 'NYSE', exchangeShortName: 'NYSE', type: 'ETF' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 410.0, exchange: 'NASDAQ', exchangeShortName: 'NASDAQ', type: 'ETF' },
    { symbol: 'VXUS', name: 'Vanguard Total International Stock ETF', price: 60.0, exchange: 'NASDAQ', exchangeShortName: 'NASDAQ', type: 'ETF' },
    { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', price: 48.0, exchange: 'NYSE', exchangeShortName: 'NYSE', type: 'ETF' },
    { symbol: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', price: 42.0, exchange: 'NYSE', exchangeShortName: 'NYSE', type: 'ETF' },
    { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', price: 72.0, exchange: 'NASDAQ', exchangeShortName: 'NASDAQ', type: 'ETF' },
    { symbol: 'BNDX', name: 'Vanguard Total International Bond ETF', price: 48.0, exchange: 'NASDAQ', exchangeShortName: 'NASDAQ', type: 'ETF' },
    { symbol: 'VNQ', name: 'Vanguard Real Estate ETF', price: 85.0, exchange: 'NYSE', exchangeShortName: 'NYSE', type: 'ETF' },
    { symbol: 'VUSA-IE', name: 'Vanguard S&P 500 UCITS ETF', price: 85.0, exchange: 'LSE', exchangeShortName: 'LSE', type: 'ETF' },
    { symbol: 'EQQQ-IE', name: 'Invesco NASDAQ-100 UCITS ETF', price: 370.0, exchange: 'LSE', exchangeShortName: 'LSE', type: 'ETF' },
    { symbol: 'CSPX-IE', name: 'iShares Core S&P 500 UCITS ETF', price: 480.0, exchange: 'LSE', exchangeShortName: 'LSE', type: 'ETF' }
  ];
}

// Função para obter ETFs líquidos (volume > 10M/dia)
export async function getLiquidETFs(): Promise<ETF[]> {
  try {
    const etfs = await getETFList();
    
    // Se a lista estiver vazia, usar lista de fallback
    if (!etfs || etfs.length === 0) {
      return getFallbackETFs();
    }
    
    const symbols = etfs.map(etf => etf.symbol).slice(0, 100); // Limitar para não sobrecarregar a API
    
    try {
      const quotes = await getETFQuotes(symbols);
      const liquidETFs = quotes
        .filter(quote => quote.volume > 10000000) // Volume > 10M
        .map(quote => {
          const etfInfo = etfs.find(etf => etf.symbol === quote.symbol);
          return etfInfo;
        })
        .filter(Boolean) as ETF[];
      
      // Se não encontrar ETFs líquidos suficientes, usar fallback
      if (liquidETFs.length < 10) {
        return getFallbackETFs();
      }
      
      return liquidETFs.slice(0, 80); // Retornar os 80 ETFs mais líquidos
    } catch (error) {
      console.error('Erro ao obter cotações:', error);
      return getFallbackETFs();
    }
  } catch (error) {
    console.error('Erro ao obter lista de ETFs:', error);
    return getFallbackETFs();
  }
}
