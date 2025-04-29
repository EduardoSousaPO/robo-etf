import { getETFList, getETFQuotes, getETFHoldings, getStockChart } from './yahoo-finance-official';

// Tipos para o dashboard de ETFs
export interface ETFSummary {
  symbol: string;
  name: string;
  price: number;
  change: number;
  volume: number;
  category: string;
  region: string;
}

export interface ETFDetail extends ETFSummary {
  description: string;
  aum: number; // Assets Under Management (Patrimônio Líquido)
  expense_ratio: number;
  inception_date: string;
  holdings: {
    asset: string;
    name: string;
    weight: number;
    sector?: string;
    country?: string;
  }[];
  performance: {
    period: string;
    return: number;
  }[];
  risk_metrics: {
    volatility: number;
    beta: number;
    sharpe: number;
    max_drawdown: number;
  };
  sector_allocation: {
    sector: string;
    weight: number;
  }[];
  country_allocation: {
    country: string;
    weight: number;
  }[];
}

// Mapeamento de categorias de ETFs (simplificado, expandir conforme necessário)
const ETF_CATEGORIES: Record<string, string[]> = {
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

// Mapeamento de regiões de ETFs (simplificado)
const ETF_REGIONS: Record<string, string[]> = {
  'US': ['SPY', 'VOO', 'VTI', 'QQQ', 'IVV', 'ITOT', 'SCHB', 'DIA', 'RSP', 'SPLG'],
  'Global': ['VXUS', 'ACWI', 'VT', 'IXUS'],
  'Europe': ['VGK', 'IEUR', 'EZU', 'FEZ', 'HEZU'],
  'Asia': ['AAXJ', 'FXI', 'EWJ', 'MCHI', 'EWY'],
  'LatAm': ['ILF', 'EWZ', 'EWW', 'ECH', 'EPU'],
  'Brazil': ['BOVA11.SA', 'IVVB11.SA', 'SMAL11.SA', 'BOVV11.SA', 'SPXI11.SA']
};

// Função para obter categoria de um ETF
function getETFCategory(symbol: string): string {
  for (const [category, symbols] of Object.entries(ETF_CATEGORIES)) {
    if (symbols.includes(symbol)) {
      return category;
    }
  }
  return 'Other';
}

// Função para obter região de um ETF
function getETFRegion(symbol: string): string {
  for (const [region, symbols] of Object.entries(ETF_REGIONS)) {
    if (symbols.includes(symbol)) {
      return region;
    }
  }
  // Default to US if not found in other regions, or Global if it's a global ETF
  if (['VXUS', 'ACWI', 'VT', 'IXUS'].includes(symbol)) return 'Global';
  return 'US'; // Assume US if not explicitly mapped
}

// Função para obter lista de ETFs com filtros
export async function getFilteredETFs(
  category: string = 'all',
  region: string = 'global',
  limit: number = 50,
  filter: Record<string, any> = {}
): Promise<ETFSummary[]> {
  try {
    // Obter lista completa de ETFs (usando uma lista fixa como fallback/exemplo)
    // Idealmente, isso viria de uma API como FMP ou outra fonte
    const etfList = await getETFList(); // Usando a função existente
    
    if (!etfList || etfList.length === 0) {
      console.warn('ETF list from API is empty, using fallback list.');
      // Fallback list if API fails or returns empty
      const fallbackSymbols = Object.values(ETF_CATEGORIES).flat().concat(Object.values(ETF_REGIONS).flat());
      const uniqueSymbols = [...new Set(fallbackSymbols)].slice(0, 200); // Limit fallback size
      const quotes = await getETFQuotes(uniqueSymbols);
      return quotes.map(q => ({
        symbol: q.symbol,
        name: q.name,
        price: q.price,
        change: q.change,
        volume: q.volume,
        category: getETFCategory(q.symbol),
        region: getETFRegion(q.symbol)
      })).slice(0, limit);
    }

    // Aplicar filtros
    let filteredETFs = etfList.map(etf => ({
      symbol: etf.symbol,
      name: etf.name,
      price: etf.price,
      change: etf.change,
      volume: etf.volume,
      category: getETFCategory(etf.symbol),
      region: getETFRegion(etf.symbol)
    }));

    // Filtrar por categoria
    if (category !== 'all') {
      filteredETFs = filteredETFs.filter(etf => etf.category === category);
    }

    // Filtrar por região
    if (region !== 'global') {
      filteredETFs = filteredETFs.filter(etf => etf.region === region);
    }

    // Aplicar filtros adicionais (exemplo)
    if (filter.minPrice) {
      filteredETFs = filteredETFs.filter(etf => etf.price >= filter.minPrice);
    }
    if (filter.maxPrice) {
      filteredETFs = filteredETFs.filter(etf => etf.price <= filter.maxPrice);
    }
    if (filter.minVolume) {
      filteredETFs = filteredETFs.filter(etf => etf.volume >= filter.minVolume);
    }

    // Ordenar por volume (padrão)
    filteredETFs.sort((a, b) => b.volume - a.volume);

    // Limitar resultados
    return filteredETFs.slice(0, limit);
  } catch (error) {
    console.error('Erro ao obter ETFs filtrados:', error);
    // Retornar lista vazia ou uma lista de fallback em caso de erro
    return [];
  }
}

// Função para obter detalhes de um ETF específico
export async function getETFDetails(symbol: string): Promise<ETFDetail | null> {
  try {
    // Obter cotação do ETF
    const quotes = await getETFQuotes([symbol]);
    if (!quotes || quotes.length === 0) {
      console.error(`Cotação não encontrada para ${symbol}`);
      return null;
    }
    const quote = quotes[0];

    // Obter holdings do ETF
    let holdings: any[] = [];
    try {
      holdings = await getETFHoldings(symbol);
    } catch (holdingsError) {
      console.warn(`Erro ao obter holdings para ${symbol}:`, holdingsError);
      // Continuar mesmo sem holdings
    }

    // Obter dados históricos para performance
    let chartData: any = null;
    try {
      chartData = await getStockChart(symbol, '5y', '1d'); // Usar '1d' para mais granularidade
    } catch (chartError) {
      console.warn(`Erro ao obter dados históricos para ${symbol}:`, chartError);
      // Continuar mesmo sem dados históricos
    }

    // Calcular métricas de performance
    const performance = [
      { period: '1M', return: calculateReturn(chartData, 30) },
      { period: '3M', return: calculateReturn(chartData, 90) },
      { period: '6M', return: calculateReturn(chartData, 180) },
      { period: '1Y', return: calculateReturn(chartData, 365) },
      { period: '3Y', return: calculateReturn(chartData, 1095) },
      { period: '5Y', return: calculateReturn(chartData, 1825) }
    ];

    // Calcular métricas de risco
    const riskMetrics = calculateRiskMetrics(chartData);

    // Calcular alocação por setor e país
    const sectorAllocation = calculateSectorAllocation(holdings);
    const countryAllocation = calculateCountryAllocation(holdings);

    // Obter dados adicionais (simulados/placeholders)
    const description = `Informações detalhadas sobre o ETF ${quote.name} (${symbol}).`; // Obter de API de perfil se disponível
    const aum = estimateAUM(quote.price, quote.volume); // Estimativa simples
    const expenseRatio = getExpenseRatio(symbol); // Placeholder
    const inceptionDate = getInceptionDate(symbol); // Placeholder

    // Construir objeto ETFDetail
    const etfDetail: ETFDetail = {
      symbol: quote.symbol,
      name: quote.name,
      price: quote.price,
      change: quote.change,
      volume: quote.volume,
      category: getETFCategory(symbol),
      region: getETFRegion(symbol),
      description,
      aum,
      expense_ratio: expenseRatio,
      inception_date: inceptionDate,
      holdings,
      performance,
      risk_metrics: riskMetrics,
      sector_allocation: sectorAllocation,
      country_allocation: countryAllocation
    };

    return etfDetail;
  } catch (error) {
    console.error(`Erro ao obter detalhes do ETF ${symbol}:`, error);
    return null;
  }
}

// --- Funções Auxiliares --- 

function calculateReturn(chartData: any, days: number): number {
  if (!chartData || !chartData.prices || chartData.prices.length < 2) {
    return 0;
  }

  const prices = chartData.prices;
  const currentPrice = prices[prices.length - 1].close;
  if (currentPrice === null || currentPrice === undefined) return 0;

  // Encontrar o preço mais próximo do período desejado
  let pastIndex = -1;
  const targetTimestamp = Date.now() - days * 24 * 60 * 60 * 1000;

  for (let i = prices.length - 1; i >= 0; i--) {
    if (prices[i].date * 1000 <= targetTimestamp) {
      pastIndex = i;
      break;
    }
  }
  
  // Se não encontrar data exata, pegar o mais antigo disponível
  if (pastIndex === -1 && prices.length > 0) {
      pastIndex = 0;
  }

  if (pastIndex === -1 || prices[pastIndex].close === null || prices[pastIndex].close === undefined || prices[pastIndex].close === 0) {
    return 0; // Não é possível calcular
  }

  const pastPrice = prices[pastIndex].close;
  return ((currentPrice / pastPrice) - 1) * 100;
}

function calculateRiskMetrics(chartData: any): any {
  if (!chartData || !chartData.prices || chartData.prices.length < 30) {
    return {
      volatility: 0,
      beta: 1, // Placeholder
      sharpe: 0, // Placeholder
      max_drawdown: 0
    };
  }

  const prices = chartData.prices.map((p: any) => p.close).filter((p: number | null) => p !== null) as number[];
  if (prices.length < 30) {
      return { volatility: 0, beta: 1, sharpe: 0, max_drawdown: 0 };
  }
  
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i-1] !== 0) {
        const dailyReturn = (prices[i] / prices[i-1]) - 1;
        returns.push(dailyReturn);
    } else {
        returns.push(0);
    }
  }

  if (returns.length === 0) {
      return { volatility: 0, beta: 1, sharpe: 0, max_drawdown: 0 };
  }

  // Calcular volatilidade (desvio padrão anualizado)
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Anualizado e em percentual

  // Calcular máximo drawdown
  let maxDrawdown = 0;
  let peak = prices[0];
  for (const price of prices) {
    if (price > peak) {
      peak = price;
    }
    if (peak > 0) {
        const drawdown = (peak - price) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
    } else {
        maxDrawdown = 1; // Se o pico for 0, drawdown é 100%
    }
  }

  // Calcular Sharpe Ratio (simplificado, assumindo taxa livre de risco de 2%)
  const riskFreeRate = 0.02;
  const annualizedReturn = mean * 252;
  const sharpe = volatility > 0 ? (annualizedReturn - riskFreeRate) / (volatility / 100) : 0;

  return {
    volatility: isNaN(volatility) ? 0 : volatility,
    beta: 1, // Placeholder - requer dados de benchmark
    sharpe: isNaN(sharpe) ? 0 : sharpe,
    max_drawdown: isNaN(maxDrawdown) ? 0 : maxDrawdown * 100 // Em percentual
  };
}

function calculateSectorAllocation(holdings: any[]): { sector: string; weight: number }[] {
  if (!holdings || holdings.length === 0) return [];

  const allocation: Record<string, number> = {};
  let totalWeight = 0;

  holdings.forEach(holding => {
    const sector = holding.sector || 'Não Classificado';
    const weight = holding.weight || 0;
    allocation[sector] = (allocation[sector] || 0) + weight;
    totalWeight += weight;
  });

  // Normalizar para 100% se o total for ligeiramente diferente
  const factor = totalWeight > 0 ? 100 / totalWeight : 0;

  return Object.entries(allocation)
    .map(([sector, weight]) => ({ sector, weight: weight * factor }))
    .sort((a, b) => b.weight - a.weight);
}

function calculateCountryAllocation(holdings: any[]): { country: string; weight: number }[] {
   if (!holdings || holdings.length === 0) return [];

  const allocation: Record<string, number> = {};
  let totalWeight = 0;

  holdings.forEach(holding => {
    // Tentar obter país do ativo, se não, usar placeholder
    const country = holding.country || 'Desconhecido'; 
    const weight = holding.weight || 0;
    allocation[country] = (allocation[country] || 0) + weight;
    totalWeight += weight;
  });

  const factor = totalWeight > 0 ? 100 / totalWeight : 0;

  return Object.entries(allocation)
    .map(([country, weight]) => ({ country, weight: weight * factor }))
    .sort((a, b) => b.weight - a.weight);
}

// Placeholder/Estimativa para AUM
function estimateAUM(price: number, volume: number): number {
  // Estimativa muito grosseira, idealmente viria de uma API
  return price * volume * 10; // Fator arbitrário
}

// Placeholder para Taxa de Administração
function getExpenseRatio(symbol: string): number {
  // Mapeamento simulado, idealmente viria de uma API
  const ratios: Record<string, number> = {
    'SPY': 0.09, 'VOO': 0.03, 'VTI': 0.03, 'QQQ': 0.20, 'AGG': 0.03, 'GLD': 0.40
  };
  return ratios[symbol] || 0.15; // Default
}

// Placeholder para Data de Início
function getInceptionDate(symbol: string): string {
  // Mapeamento simulado, idealmente viria de uma API
  const dates: Record<string, string> = {
    'SPY': '1993-01-22', 'VOO': '2010-09-07', 'VTI': '2001-05-24', 'QQQ': '1999-03-10'
  };
  return dates[symbol] || '2000-01-01'; // Default
}

