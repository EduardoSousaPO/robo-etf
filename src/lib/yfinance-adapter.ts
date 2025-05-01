/**
 * Adaptador para a API Python que utiliza API FMP
 * Este arquivo fornece funções para acessar a API Python que agora 
 * usa exclusivamente a Financial Modeling Prep (FMP) API.
 */

import { ETF, ETFHolding, ETFQuote, HistoricalDataPoint } from "../lib/api-types";
import { PYTHON_API_URL } from "../lib/constants";

// URL para o microserviço Python - importada de constants.ts
console.log(`Adaptador usando API Python em: ${PYTHON_API_URL}`);

// Configurações para retry
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

// Função auxiliar para aguardar um tempo específico
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função para verificar a saúde da API antes de fazer requisições
export async function checkAPIHealth(): Promise<boolean> {
  try {
    console.log('Verificando saúde da API Python...');
    // Timeout mais curto para health check
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${PYTHON_API_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`API Health check falhou: ${response.status} ${response.statusText}`);
      return false;
    }
    
    const data = await response.json() as { status: string };
    console.log('API Health check sucesso:', data);
    return data.status === 'online';
  } catch (error) {
    console.error('Erro ao verificar saúde da API:', error);
    return false;
  }
}

/**
 * Função genérica para fazer chamadas à API Python com retry
 */
async function fetchFromPythonAPI<T>(endpoint: string): Promise<T> {
  let lastError: Error | null = null;
  
  // Verificar saúde da API antes
  const isHealthy = await checkAPIHealth();
  if (!isHealthy) {
    console.warn('API não está saudável. Tentando a requisição mesmo assim...');
  }
  
  // Tentar a requisição várias vezes
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Fazendo solicitação para: ${PYTHON_API_URL}${endpoint} (tentativa ${attempt}/${MAX_RETRIES})`);
      
      // Usando AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
      
      const response = await fetch(`${PYTHON_API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        cache: 'no-store'
      });
      
      // Limpar o timeout
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro HTTP ${response.status}: ${errorText}`);
        throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json() as T;
      console.log(`Resposta recebida de ${endpoint} (primeiros itens):`, 
        Array.isArray(data) ? data.slice(0, 2) : data);
      return data;
    } catch (error) {
      lastError = error as Error;
      console.error(`Erro ao acessar a API Python (${endpoint}): Tentativa ${attempt}/${MAX_RETRIES}`, error);
      
      // Se não for a última tentativa, aguarde antes de tentar novamente
      if (attempt < MAX_RETRIES) {
        const backoffDelay = RETRY_DELAY * attempt;
        console.log(`Aguardando ${backoffDelay}ms antes da próxima tentativa...`);
        await sleep(backoffDelay);
      }
    }
  }
  
  // Se chegou aqui, todas as tentativas falharam
  console.error(`Todas as ${MAX_RETRIES} tentativas falharam para ${endpoint}`);
  
  // Retornar dados fictícios como fallback
  if (endpoint.includes('/api/etf/region/')) {
    return getFallbackETFsByRegion(endpoint.split('/').pop() || 'global') as unknown as T;
  } else if (endpoint.includes('/api/etf/quotes')) {
    const symbols = new URLSearchParams(endpoint.split('?')[1]).get('symbols')?.split(',') || [];
    return getFallbackETFQuotes(symbols) as unknown as T;
  }
  
  throw lastError || new Error(`Falha ao acessar ${endpoint} após ${MAX_RETRIES} tentativas`);
}

// Função para obter dados fictícios de ETFs por região como fallback
function getFallbackETFsByRegion(region: string): ETF[] {
  console.log(`Usando dados de fallback para região ${region}`);
  
  const fallbackETFs: Record<string, ETF[]> = {
    'global': [
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', price: 400, exchange: 'ARCA', exchangeShortName: 'ARCA', type: 'ETF' },
      { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', price: 350, exchange: 'ARCA', exchangeShortName: 'ARCA', type: 'ETF' },
      { symbol: 'QQQ', name: 'Invesco QQQ Trust', price: 300, exchange: 'NASDAQ', exchangeShortName: 'NASDAQ', type: 'ETF' }
    ],
    'us': [
      { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', price: 400, exchange: 'ARCA', exchangeShortName: 'ARCA', type: 'ETF' },
      { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', price: 220, exchange: 'ARCA', exchangeShortName: 'ARCA', type: 'ETF' }
    ],
    'br': [
      { symbol: 'BOVA11.SA', name: 'iShares Ibovespa', price: 100, exchange: 'BOVESPA', exchangeShortName: 'BOVESPA', type: 'ETF' },
      { symbol: 'IVVB11.SA', name: 'iShares S&P 500 BRL', price: 280, exchange: 'BOVESPA', exchangeShortName: 'BOVESPA', type: 'ETF' }
    ]
  };
  
  return fallbackETFs[region] || fallbackETFs['global'];
}

// Função para obter dados fictícios de cotações como fallback
function getFallbackETFQuotes(symbols: string[]): ETFQuote[] {
  console.log(`Usando dados de fallback para cotações: ${symbols.join(',')}`);
  
  return symbols.map(symbol => ({
    symbol,
    price: 100 + Math.random() * 300,
    changesPercentage: (Math.random() * 2 - 1) * 5, // Entre -5% e +5%
    change: 0,
    volume: 500000 + Math.random() * 5000000,
    beta: 1 + Math.random() * 0.5
  }));
}

/**
 * Obtém a lista completa de ETFs da API
 */
export async function getETFList(): Promise<ETF[]> {
  console.log('Obtendo lista de ETFs via Python API (FMP)...');
  return fetchFromPythonAPI<ETF[]>('/api/etf/list');
}

/**
 * Mapeia a região para o formato aceito pela API Python
 */
function mapRegion(region: string): string {
  const regionMap: Record<string, string> = {
    'global': 'global',
    'us': 'us',
    'usa': 'us',
    'eua': 'us',
    'br': 'br',
    'brasil': 'br',
    'brazil': 'br',
    'eu': 'eu',
    'europe': 'eu',
    'europa': 'eu',
    'asia': 'asia',
  };
  
  return regionMap[region.toLowerCase()] || 'global';
}

/**
 * Obtém ETFs por região geográfica
 */
export async function getETFsByRegion(region: string): Promise<ETF[]> {
  const mappedRegion = mapRegion(region);
  console.log(`Obtendo ETFs para região ${mappedRegion} via Python API (FMP)...`);
  return fetchFromPythonAPI<ETF[]>(`/api/etf/region/${mappedRegion}`);
}

/**
 * Obtém cotações para uma lista de ETFs
 */
export async function getETFQuotes(symbols: string[]): Promise<ETFQuote[]> {
  if (!symbols || symbols.length === 0) {
    return [];
  }
  
  console.log(`Obtendo cotações para ${symbols.length} ETFs via Python API (FMP)...`);
  const symbolsString = symbols.join(',');
  return fetchFromPythonAPI<ETFQuote[]>(`/api/etf/quotes?symbols=${symbolsString}`);
}

/**
 * Obtém as holdings (componentes) de um ETF
 */
export async function getETFHoldings(symbol: string): Promise<ETFHolding[]> {
  console.log(`Obtendo holdings para ETF ${symbol} via Python API (FMP)...`);
  try {
    return await fetchFromPythonAPI<ETFHolding[]>(`/api/etf/holdings/${symbol}`);
  } catch (error) {
    console.error(`Erro ao obter holdings para ${symbol}, retornando array vazio`, error);
    return [];
  }
}

/**
 * Converte as datas para um período da API FMP
 */
function datesToPeriod(from: string, to: string): string {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffInDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays <= 7) {
    return '5d';
  } else if (diffInDays <= 30) {
    return '1mo';
  } else if (diffInDays <= 90) {
    return '3mo';
  } else if (diffInDays <= 180) {
    return '6mo';
  } else if (diffInDays <= 365) {
    return '1y';
  } else if (diffInDays <= 730) {
    return '2y';
  } else {
    return '5y';
  }
}

/**
 * Obtém os preços históricos de um ETF
 */
export async function getHistoricalPrices(
  symbol: string,
  from: string,
  to: string
): Promise<HistoricalDataPoint[]> {
  const period = datesToPeriod(from, to);
  console.log(`Obtendo preços históricos para ${symbol} via Python API (FMP)...`);
  try {
    return await fetchFromPythonAPI<HistoricalDataPoint[]>(`/api/etf/historical/${symbol}?period=${period}`);
  } catch (error) {
    console.error(`Erro ao obter dados históricos para ${symbol}, retornando array vazio`, error);
    return [];
  }
} 