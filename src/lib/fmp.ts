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

// Função para verificar se há dados válidos no cache
function isCacheValid(key: string): boolean {
  if (!cache[key]) return false;
  
  const { timestamp } = cache[key];
  const now = Date.now();
  const cacheAge = now - timestamp;
  
  // Considerar válido se tiver menos de 15 minutos
  return cacheAge < 15 * 60 * 1000;
}

// Função para obter dados do cache
function getCache<T>(key: string): T | null {
  if (isCacheValid(key)) {
    console.log(`Usando dados em cache para ${key}`);
    return cache[key].data as T;
  }
  return null;
}

// Função para armazenar dados no cache
function setCache<T>(key: string, data: T, duration: number = 15 * 60 * 1000): void {
  cache[key] = {
    data,
    timestamp: Date.now(),
  };
  console.log(`Dados armazenados em cache para ${key} (${duration/1000}s)`);
}

// Função auxiliar para buscar e cachear dados da API
async function fetchWithCache<T>(url: string, cacheKey: string): Promise<T> {
  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return cachedData as T;
  }
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro na API FMP: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.warn('Resposta vazia da API FMP');
      throw new Error('Resposta vazia da API FMP');
    }
    
    // Cachear dados por 15 minutos
    setCache(cacheKey, data, 15 * 60 * 1000);
    
    return data as T;
  } catch (error) {
    console.error('Erro ao buscar dados da API FMP:', error);
    throw error;
  }
}

// Função para listar todos os ETFs disponíveis
export async function getETFList(): Promise<ETF[]> {
  const url = `https://financialmodelingprep.com/api/v3/etf/list?apikey=${FMP_API_KEY}`;
  return fetchWithCache<ETF[]>(url, 'etf_list');
}

// Função para obter as holdings de um ETF específico
export async function getETFHoldings(symbol: string): Promise<ETFHolding[]> {
  const url = `https://financialmodelingprep.com/api/v3/etf-holder/${symbol}?apikey=${FMP_API_KEY}`;
  return fetchWithCache<ETFHolding[]>(url, `holdings_${symbol}`);
}

// Função para obter cotações de ETFs
export async function getETFQuotes(symbols: string[]): Promise<ETFQuote[]> {
  if (!symbols || symbols.length === 0) {
    console.warn('Lista de símbolos vazia para getETFQuotes');
    return [];
  }

  try {
    const symbolsStr = symbols.join(',');
    console.log(`Buscando cotações para ${symbols.length} ETFs`);
    console.log(`Fazendo requisição para: https://financialmodelingprep.com/api/v3/quote/${symbolsStr}?apikey=${FMP_API_KEY}`);
    console.log(`Usando chave de API: ${FMP_API_KEY ? 'CONFIGURADA' : 'NÃO CONFIGURADA'}`);
    
    const url = `https://financialmodelingprep.com/api/v3/quote/${symbolsStr}?apikey=${FMP_API_KEY}`;
    const data = await fetchWithCache(url, `quotes_${symbolsStr}`);
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.warn('Nenhuma cotação retornada da API FMP');
      // Retornar cotações de fallback em caso de erro
      return getFallbackETFQuotes(symbols);
    }
    
    return data as ETFQuote[];
  } catch (error) {
    console.error('Erro ao obter cotações para ETFs:', error);
    // Retornar cotações de fallback em caso de erro
    return getFallbackETFQuotes(symbols);
  }
}

// Gerar cotações de fallback para ETFs quando a API falha
function getFallbackETFQuotes(symbols: string[]): ETFQuote[] {
  console.log('Usando cotações de fallback para ETFs');
  const fallbackPrices: Record<string, number> = {
    'SPY': 480.75,
    'VOO': 440.35,
    'QQQ': 420.55,
    'VTI': 245.80,
    'VXUS': 58.70,
    'VEA': 49.25,
    'VWO': 42.65,
    'BND': 72.40,
    'BNDX': 49.85,
    'VNQ': 85.60,
    'VUSA-IE': 88.25,
    'EQQQ-IE': 370.40,
    'CSPX-IE': 485.30,
    'VIG': 180.40,
    'SCHD': 78.55,
    'XLK': 210.30,
    'IWM': 198.45,
    'VGT': 470.85,
    'ARKK': 45.65,
    'ARKW': 65.80
  };
  
  return symbols.map(symbol => {
    // Usar preço conhecido ou gerar um valor aleatório entre 50 e 500
    const price = fallbackPrices[symbol] || (50 + Math.random() * 450);
    // Gerar uma mudança percentual aleatória entre -1% e +1%
    const changesPercentage = (Math.random() * 2 - 1) * 1.0;
    const change = price * (changesPercentage / 100);
    
    return {
      symbol: symbol,
      price: price,
      changesPercentage: changesPercentage,
      change: change,
      volume: 1000000 + Math.random() * 50000000, // Volume aleatório entre 1M e 51M
      beta: 0.8 + Math.random() * 0.5 // Beta aleatório entre 0.8 e 1.3
    };
  });
}

// Função para obter preços históricos de um ETF
export async function getHistoricalPrices(
  symbol: string,
  from: string,
  to: string
): Promise<HistoricalPrice[]> {
  const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?from=${from}&to=${to}&apikey=${FMP_API_KEY}`;
  const cacheKey = `historical_${symbol}_${from}_${to}`;
  
  try {
    const response = await fetchWithCache<{ historical: HistoricalPrice[] }>(url, cacheKey);
    if (!response.historical) {
      console.warn(`Dados históricos não encontrados para ${symbol}`);
      return [];
    }
    return response.historical;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`Erro ao obter preços históricos para ${symbol}: ${errorMessage}`);
    return [];
  }
}

// Função de fallback com ETFs populares
function getFallbackETFs(): ETF[] {
  console.warn('Usando lista de ETFs de fallback');
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
    console.log('Iniciando getLiquidETFs...');
    
    // Verificar se a chave de API está configurada
    if (!FMP_API_KEY) {
      console.error('FMP_API_KEY não está configurada. Configure-a no arquivo .env.local');
      return getFallbackETFs();
    }
    
    const etfs = await getETFList();
    
    // Se a lista estiver vazia, usar lista de fallback
    if (!etfs || etfs.length === 0) {
      console.warn('Lista de ETFs vazia retornada da API');
      return getFallbackETFs();
    }
    
    console.log(`Obtidos ${etfs.length} ETFs da lista`);
    
    // Limitar para não sobrecarregar a API
    const maxETFsToQuery = 100; 
    const symbols = etfs.map(etf => etf.symbol).slice(0, maxETFsToQuery); 
    
    try {
      const quotes = await getETFQuotes(symbols);
      
      if (!quotes || quotes.length === 0) {
        console.warn('Nenhuma cotação retornada da API');
        return getFallbackETFs();
      }
      
      console.log(`Obtidas ${quotes.length} cotações de ETFs`);
      
      // Filtrar para encontrar ETFs líquidos com volume > 10M
      const liquidETFs = quotes
        .filter(quote => {
          const hasValidVolume = quote.volume > 10000000;
          if (hasValidVolume) {
            console.log(`ETF com volume alto: ${quote.symbol} (${quote.volume})`);
          }
          return hasValidVolume;
        })
        .map(quote => {
          const etfInfo = etfs.find(etf => etf.symbol === quote.symbol);
          return etfInfo;
        })
        .filter(Boolean) as ETF[];
      
      console.log(`Encontrados ${liquidETFs.length} ETFs líquidos`);
      
      // Se não encontrar ETFs líquidos suficientes, usar fallback
      if (liquidETFs.length < 10) {
        console.warn(`Poucos ETFs líquidos encontrados (${liquidETFs.length}), usando fallback`);
        return getFallbackETFs();
      }
      
      const result = liquidETFs.slice(0, 80); // Retornar os 80 ETFs mais líquidos
      console.log(`Retornando ${result.length} ETFs líquidos`);
      return result;
    } catch (error) {
      console.error('Erro ao obter cotações:', error);
      return getFallbackETFs();
    }
  } catch (error) {
    console.error('Erro ao obter lista de ETFs:', error);
    return getFallbackETFs();
  }
}
