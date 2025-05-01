/**
 * Arquivo adaptador para usar exclusivamente a API FMP
 * Este arquivo encapsula toda a comunicação com as APIs de dados financeiros,
 * Utilizando apenas a API do FMP (Financial Modeling Prep) através do microserviço Python.
 */

import { ETF, ETFHolding, ETFQuote, HistoricalDataPoint } from "../lib/api-types";
import {
  getETFList as getPythonETFList,
  getETFQuotes as getPythonETFQuotes,
  getETFHoldings as getPythonETFHoldings,
  getHistoricalPrices as getPythonHistoricalPrices,
  getETFsByRegion as getPythonETFsByRegion
} from './yfinance-adapter';

/**
 * Obtém ETFs líquidos baseados em critérios de negociação
 * @param limit Número máximo de ETFs a retornar
 * @param minVolume Volume mínimo para considerar um ETF como líquido
 * @returns Lista de ETFs líquidos
 */
export async function getLiquidETFs(
  limit: number = 10,
  minVolume: number = 100000,
  region: string = 'global'
): Promise<ETF[]> {
  try {
    console.log(`Obtendo ETFs líquidos para região ${region}...`);
    
    // Obtém ETFs por região via API Python (FMP)
    const etfs = await getPythonETFsByRegion(region);
    
    // Obtém cotações para esses ETFs
    const symbols = etfs.map((etf) => etf.symbol);
    const quotes = await getPythonETFQuotes(symbols);
    
    // Filtra ETFs com volume suficiente
    const liquidEtfs = etfs
      .filter((etf) => {
        const quote = quotes.find((q) => q.symbol === etf.symbol);
        return quote && quote.volume >= minVolume;
      })
      .sort((a, b) => {
        const quoteA = quotes.find((q) => q.symbol === a.symbol);
        const quoteB = quotes.find((q) => q.symbol === b.symbol);
        return (quoteB?.volume || 0) - (quoteA?.volume || 0);
      })
      .slice(0, limit);
    
    console.log(`Retornando ${liquidEtfs.length} ETFs líquidos da API Python (FMP)`);
    return liquidEtfs;
  } catch (error) {
    console.error("Erro ao obter ETFs líquidos:", error);
    throw new Error("Não foi possível obter ETFs líquidos. Tente novamente mais tarde.");
  }
}

/**
 * Obtém a lista completa de ETFs disponíveis
 * @returns Lista de ETFs
 */
export async function getETFList(): Promise<ETF[]> {
  try {
    console.log(`Obtendo lista de ETFs via API Python (FMP)...`);
    const etfs = await getPythonETFList();
    console.log(`Retornando ${etfs.length} ETFs da API Python (FMP)`);
    return etfs;
  } catch (error) {
    console.error("Erro ao obter lista de ETFs:", error);
    throw new Error("Não foi possível obter a lista de ETFs. Tente novamente mais tarde.");
  }
}

/**
 * Obtém cotações para uma lista de símbolos de ETFs
 * @param symbols Lista de símbolos para buscar cotações
 * @returns Lista de cotações de ETFs
 */
export async function getETFQuotes(symbols: string[]): Promise<ETFQuote[]> {
  try {
    console.log(`Obtendo cotações para ${symbols.length} ETFs via API Python (FMP)...`);
    const quotes = await getPythonETFQuotes(symbols);
    return quotes;
  } catch (error) {
    console.error(`Erro ao obter cotações:`, error);
    throw new Error(`Não foi possível obter cotações. Tente novamente mais tarde.`);
  }
}

/**
 * Obtém as holdings (ativos que compõem) um ETF
 * @param symbol Símbolo do ETF
 * @returns Lista de holdings do ETF
 */
export async function getETFHoldings(symbol: string): Promise<ETFHolding[]> {
  try {
    console.log(`Obtendo holdings para ETF ${symbol} via API Python (FMP)...`);
    const holdings = await getPythonETFHoldings(symbol);
    return holdings;
  } catch (error) {
    console.error(`Erro ao obter holdings:`, error);
    throw new Error(`Não foi possível obter as holdings para ${symbol}. Tente novamente mais tarde.`);
  }
}

/**
 * Obtém dados históricos de preços para um ETF
 * @param symbol Símbolo do ETF
 * @param from Data de início (ISO string)
 * @param to Data de fim (ISO string)
 * @returns Lista de pontos de dados históricos
 */
export async function getHistoricalPrices(
  symbol: string,
  from: string,
  to: string
): Promise<HistoricalDataPoint[]> {
  try {
    console.log(`Obtendo preços históricos para ${symbol} via API Python (FMP)...`);
    const prices = await getPythonHistoricalPrices(symbol, from, to);
    return prices;
  } catch (error) {
    console.error(`Erro ao obter preços históricos:`, error);
    throw new Error(`Não foi possível obter os preços históricos para ${symbol}. Tente novamente mais tarde.`);
  }
}

/**
 * Obtém lista de ETFs por região geográfica
 * @param region Região (global, us, asia, eu, br)
 * @returns Lista de ETFs da região
 */
export async function getETFsByRegion(region: string = 'global'): Promise<ETF[]> {
  try {
    console.log(`Obtendo ETFs para região ${region} via API Python (FMP)...`);
    const etfs = await getPythonETFsByRegion(region);
    return etfs;
  } catch (error) {
    console.error(`Erro ao obter ETFs por região:`, error);
    throw new Error(`Não foi possível obter ETFs para a região ${region}. Tente novamente mais tarde.`);
  }
}

// Exportamos os tipos do módulo FMP para manter compatibilidade
export type { ETF, ETFHolding, ETFQuote, HistoricalDataPoint };

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