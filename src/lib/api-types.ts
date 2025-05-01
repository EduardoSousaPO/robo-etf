/**
 * Definições de tipos para as APIs de dados financeiros
 */

/**
 * Representa um ETF (Exchange Traded Fund)
 */
export interface ETF {
  symbol: string;
  name: string;
  price: number;
  exchange: string;
  exchangeShortName?: string;
  type: string;
}

/**
 * Representa uma cotação de ETF
 */
export interface ETFQuote {
  symbol: string;
  price: number;
  changesPercentage: number;
  change: number;
  volume: number;
  beta: number;
}

/**
 * Representa um componente (holding) de um ETF
 */
export interface ETFHolding {
  asset: string;
  name: string;
  weight: number;
  sector: string;
  country: string;
}

/**
 * Representa um ponto de dados históricos
 */
export interface HistoricalDataPoint {
  date: string;
  close: number;
}

/**
 * Interface para o tipo Portfolio usado nos testes e na aplicação
 */
export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  holdings: {
    symbol: string;
    allocation: number;
    name?: string;
  }[];
  createdAt: string;
  updatedAt: string;
} 