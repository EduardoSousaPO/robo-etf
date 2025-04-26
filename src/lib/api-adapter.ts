/**
 * Arquivo adaptador para usar Yahoo Finance e FMP APIs
 * 
 * Este arquivo serve como um adaptador para migrar gradualmente
 * da API FMP para a API do Yahoo Finance.
 */
import {
  ETF,
  ETFHolding,
  ETFQuote,
  HistoricalPrice,
  getLiquidETFs as getFmpLiquidETFs,
  getETFQuotes as getFmpETFQuotes
} from './fmp';

import {
  getETFList as getYahooETFList,
  getETFQuotes as getYahooETFQuotes,
  getETFHoldings as getYahooETFHoldings,
  getStockChart,
  YahooETF,
  YahooETFHolding
} from './yahoo-finance-official';

// Exportar funções adaptadas para usar Yahoo Finance como fonte primária
// e fallback para FMP se necessário

/**
 * Adapta um ETF do formato Yahoo para o formato FMP
 */
function adaptYahooETFToFMP(yahooEtf: YahooETF): ETF {
  return {
    symbol: yahooEtf.symbol,
    name: yahooEtf.name,
    price: yahooEtf.price,
    exchange: yahooEtf.exchange,
    exchangeShortName: yahooEtf.exchange,
    type: 'ETF'
  };
}

/**
 * Adapta um ETFQuote do formato Yahoo para o formato FMP
 */
function adaptYahooETFQuoteToFMP(yahooEtf: YahooETF): ETFQuote {
  return {
    symbol: yahooEtf.symbol,
    price: yahooEtf.price,
    changesPercentage: yahooEtf.change,
    change: yahooEtf.price * (yahooEtf.change / 100),
    volume: yahooEtf.volume || 0,
    beta: 1.0 // Valor padrão, não disponível diretamente
  };
}

/**
 * Adapta um ETFHolding do formato Yahoo para o formato FMP
 */
function adaptYahooETFHoldingToFMP(yahooHolding: YahooETFHolding): ETFHolding {
  return {
    asset: yahooHolding.asset,
    name: yahooHolding.name,
    weight: yahooHolding.weight,
    sector: yahooHolding.sector || '',
    country: yahooHolding.country || '',
  };
}

/**
 * Adapta preços históricos do Yahoo para o formato FMP
 */
function adaptYahooChartToHistoricalPrices(
  symbol: string,
  yahooChart: any
): HistoricalPrice[] {
  if (!yahooChart || !yahooChart.prices || !Array.isArray(yahooChart.prices)) {
    return [];
  }

  return yahooChart.prices.map((price: any) => ({
    date: price.date,
    close: price.close
  }));
}

/**
 * Obtém ETFs líquidos do Yahoo Finance (com alto volume)
 */
export async function getLiquidETFs(): Promise<ETFQuote[]> {
  try {
    console.log("Obtendo ETFs líquidos do Yahoo Finance...");
    
    // Tenta obter os ETFs do Yahoo Finance primeiro
    const yahooEtfs = await getYahooETFList();
    
    if (yahooEtfs && yahooEtfs.length > 0) {
      // Obter cotações para esses ETFs
      const quotes = await getYahooETFQuotes(yahooEtfs.map(etf => etf.symbol));
      
      if (quotes && quotes.length > 0) {
        // Filtrar por volume e adaptar para o formato FMP
        const liquidEtfs = quotes
          .filter(quote => quote.volume > 10000000) // Volume maior que 10 milhões
          .map(adaptYahooETFQuoteToFMP);
        
        // Se temos ETFs suficientes, retorna-os
        if (liquidEtfs.length >= 20) {
          console.log(`Retornando ${liquidEtfs.length} ETFs líquidos do Yahoo Finance`);
          return liquidEtfs.slice(0, 80); // Limita a 80 ETFs
        }
      }
    }
    
    console.log("Usando fallback para ETFs líquidos...");
    try {
      const fallbackETFs = await getFmpLiquidETFs();
      // Converter ETF[] para ETFQuote[] usando getFmpETFQuotes
      if (fallbackETFs && fallbackETFs.length > 0) {
        const symbols = fallbackETFs.map(etf => etf.symbol);
        const quotes = await getFmpETFQuotes(symbols);
        if (quotes && quotes.length > 0) {
          return quotes;
        }
      }
    } catch (fmpError) {
      console.error("Erro ao obter ETFs líquidos do FMP:", fmpError);
    }
    
    // Último recurso: retornar uma lista estática de ETFs populares
    console.log("Usando lista estática de ETFs populares como último recurso");
    return getStaticPopularETFs();
  } catch (error) {
    console.error("Erro ao obter ETFs líquidos do Yahoo Finance:", error);
    
    try {
      const fallbackETFs = await getFmpLiquidETFs();
      if (fallbackETFs && fallbackETFs.length > 0) {
        const symbols = fallbackETFs.map(etf => etf.symbol);
        const quotes = await getFmpETFQuotes(symbols);
        if (quotes && quotes.length > 0) {
          return quotes;
        }
      }
    } catch (fmpError) {
      console.error("Erro ao obter ETFs líquidos do FMP:", fmpError);
    }
    
    // Último recurso: retornar uma lista estática de ETFs populares
    console.log("Usando lista estática de ETFs populares como último recurso");
    return getStaticPopularETFs();
  }
}

/**
 * Obtém lista de ETFs
 */
export async function getETFList(): Promise<ETF[]> {
  try {
    console.log("Obtendo lista de ETFs do Yahoo Finance...");
    
    // Tenta obter os ETFs do Yahoo Finance primeiro
    const yahooEtfs = await getYahooETFList();
    
    if (yahooEtfs && yahooEtfs.length > 0) {
      return yahooEtfs.map(adaptYahooETFToFMP);
    }
    
    console.log("Usando fallback para lista de ETFs...");
    const fallbackETFs = await getFmpLiquidETFs();
    return fallbackETFs;
  } catch (error) {
    console.error("Erro ao obter lista de ETFs do Yahoo Finance:", error);
    
    // Fallback para ETFs populares
    const fallbackETFs = await getFmpLiquidETFs();
    return fallbackETFs;
  }
}

/**
 * Obtém cotações de ETFs
 */
export async function getETFQuotes(symbols: string[]): Promise<ETFQuote[]> {
  try {
    console.log(`Obtendo cotações para ${symbols.length} ETFs do Yahoo Finance...`);
    
    // Tenta obter as cotações do Yahoo Finance primeiro
    const yahooQuotes = await getYahooETFQuotes(symbols);
    
    if (yahooQuotes && yahooQuotes.length > 0) {
      return yahooQuotes.map(adaptYahooETFQuoteToFMP);
    }
    
    console.log("Usando fallback para cotações de ETFs...");
    return await getFmpETFQuotes(symbols);
      
  } catch (error) {
    console.error(`Erro ao obter cotações para ${symbols.length} ETFs do Yahoo Finance:`, error);
    
    // Fallback para cotações via FMP
    return await getFmpETFQuotes(symbols);
  }
}

/**
 * Obtém as holdings (componentes) de um ETF
 */
export async function getETFHoldings(symbol: string): Promise<ETFHolding[]> {
  try {
    console.log(`Obtendo holdings para ETF ${symbol} do Yahoo Finance...`);
    
    // Tenta obter as holdings do Yahoo Finance primeiro
    const yahooHoldings = await getYahooETFHoldings(symbol);
    
    if (yahooHoldings && yahooHoldings.length > 0) {
      return yahooHoldings.map(adaptYahooETFHoldingToFMP);
    }
    
    console.log(`Não foi possível obter holdings para ${symbol} do Yahoo Finance`);
    return [];
      
  } catch (error) {
    console.error(`Erro ao obter holdings para ETF ${symbol} do Yahoo Finance:`, error);
    return [];
  }
}

/**
 * Obtém preços históricos para um símbolo
 */
export async function getHistoricalPrices(
  symbol: string,
  from: string,
  to: string
): Promise<HistoricalPrice[]> {
  try {
    console.log(`Obtendo preços históricos para ${symbol} do Yahoo Finance...`);
    
    // Calcular a diferença entre as datas para definir o intervalo
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffInDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Definir o intervalo com base na diferença de dias
    let range = '1mo'; // padrão para 1 mês
    
    if (diffInDays <= 7) {
      range = '5d';
    } else if (diffInDays <= 30) {
      range = '1mo';
    } else if (diffInDays <= 90) {
      range = '3mo';
    } else if (diffInDays <= 180) {
      range = '6mo';
    } else if (diffInDays <= 365) {
      range = '1y';
    } else if (diffInDays <= 730) {
      range = '2y';
    } else {
      range = '5y';
    }
    
    // Tenta obter o gráfico de preços do Yahoo Finance
    const yahooChart = await getStockChart(symbol, range);
    
    if (yahooChart && yahooChart.prices && yahooChart.prices.length > 0) {
      const prices = adaptYahooChartToHistoricalPrices(symbol, yahooChart);
      
      // Filtrar para estar dentro do intervalo de datas solicitado
      return prices.filter(price => {
        const priceDate = new Date(price.date);
        return priceDate >= fromDate && priceDate <= toDate;
      });
    }
    
    console.log(`Não foi possível obter preços históricos para ${symbol} do Yahoo Finance`);
    return [];
      
  } catch (error) {
    console.error(`Erro ao obter preços históricos para ${symbol} do Yahoo Finance:`, error);
    return [];
  }
}

// Exportamos os tipos do módulo FMP para manter compatibilidade
export type { ETF, ETFHolding, ETFQuote, HistoricalPrice };

// Interface para o tipo Portfolio usado nos testes e na aplicação
export interface Portfolio {
  id: string;
  user_id: string;
  weights: Record<string, number>;
  metrics: {
    expectedReturn: number;
    risk: number; 
    sharpeRatio: number;
  };
  created_at: string;
  rebalance_date: string;
  previous_portfolio_id?: string;
  explanation?: string;
  drawdown_notified?: boolean;
}

// Função para obter uma lista estática de ETFs populares
// Usada como último recurso quando as APIs falham
function getStaticPopularETFs(): ETFQuote[] {
  console.log("Gerando lista estática de ETFs populares");
  
  const staticETFs: ETFQuote[] = [
    { 
      symbol: 'SPY', 
      price: 480.75, 
      changesPercentage: 0.12, 
      change: 0.58, 
      volume: 75000000, 
      beta: 1.0 
    },
    { 
      symbol: 'VOO', 
      price: 440.35, 
      changesPercentage: 0.15, 
      change: 0.66, 
      volume: 45000000, 
      beta: 1.0 
    },
    { 
      symbol: 'QQQ', 
      price: 420.55, 
      changesPercentage: 0.22, 
      change: 0.92, 
      volume: 38000000, 
      beta: 1.15 
    },
    { 
      symbol: 'VTI', 
      price: 245.80, 
      changesPercentage: 0.10, 
      change: 0.25, 
      volume: 32000000, 
      beta: 1.02 
    },
    { 
      symbol: 'VXUS', 
      price: 58.70, 
      changesPercentage: -0.05, 
      change: -0.03, 
      volume: 25000000, 
      beta: 0.88 
    },
    { 
      symbol: 'VEA', 
      price: 49.25, 
      changesPercentage: -0.08, 
      change: -0.04, 
      volume: 22000000, 
      beta: 0.85 
    },
    { 
      symbol: 'VWO', 
      price: 42.65, 
      changesPercentage: -0.15, 
      change: -0.06, 
      volume: 18000000, 
      beta: 0.95 
    },
    { 
      symbol: 'BND', 
      price: 72.40, 
      changesPercentage: 0.05, 
      change: 0.03, 
      volume: 15000000, 
      beta: 0.25 
    },
    { 
      symbol: 'BNDX', 
      price: 49.85, 
      changesPercentage: 0.03, 
      change: 0.01, 
      volume: 12000000, 
      beta: 0.20 
    },
    { 
      symbol: 'VNQ', 
      price: 85.60, 
      changesPercentage: 0.08, 
      change: 0.07, 
      volume: 10000000, 
      beta: 0.90 
    },
    { 
      symbol: 'VUSA-IE', 
      price: 88.25, 
      changesPercentage: 0.12, 
      change: 0.11, 
      volume: 9500000, 
      beta: 1.0 
    },
    { 
      symbol: 'EQQQ-IE', 
      price: 370.40, 
      changesPercentage: 0.20, 
      change: 0.74, 
      volume: 9000000, 
      beta: 1.15 
    }
  ];
  
  return staticETFs;
} 