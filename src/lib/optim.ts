import { getHistoricalPrices } from './fmp';
import { MIN_WEIGHT, MAX_WEIGHT, TARGET_RETURN_FACTOR } from './constants';

// Tipos para o algoritmo de otimização
export type ETFData = {
  symbol: string;
  returns: number[];
  annualizedReturn: number;
  volatility: number;
  domicile: 'US' | 'IE'; // US ou IE (Irlanda) para tratamento fiscal
};

export type OptimizationResult = {
  weights: Record<string, number>;
  metrics: {
    return: number;
    volatility: number;
    sharpe: number;
  };
};

// Função para calcular retornos diários a partir de preços históricos
function calculateDailyReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const dailyReturn = (prices[i] / prices[i - 1]) - 1;
    returns.push(dailyReturn);
  }
  return returns;
}

// Função para calcular retorno anualizado
function calculateAnnualizedReturn(dailyReturns: number[]): number {
  const totalReturn = dailyReturns.reduce((acc, ret) => (1 + acc) * (1 + ret) - 1, 0);
  const annualizedReturn = Math.pow(1 + totalReturn, 252 / dailyReturns.length) - 1;
  return annualizedReturn;
}

// Função para calcular volatilidade anualizada
function calculateVolatility(dailyReturns: number[]): number {
  const mean = dailyReturns.reduce((acc, val) => acc + val, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / dailyReturns.length;
  const dailyVolatility = Math.sqrt(variance);
  const annualizedVolatility = dailyVolatility * Math.sqrt(252);
  return annualizedVolatility;
}

// Função para calcular a matriz de covariância
function calculateCovarianceMatrix(etfsData: ETFData[]): number[][] {
  const n = etfsData.length;
  const covMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        // Variância na diagonal
        covMatrix[i][j] = Math.pow(etfsData[i].volatility, 2);
      } else {
        // Covariância fora da diagonal
        const returnsI = etfsData[i].returns;
        const returnsJ = etfsData[j].returns;
        const minLength = Math.min(returnsI.length, returnsJ.length);
        
        // Usar apenas o período comum entre os dois ETFs
        const returnsITrimmed = returnsI.slice(0, minLength);
        const returnsJTrimmed = returnsJ.slice(0, minLength);
        
        const meanI = returnsITrimmed.reduce((acc, val) => acc + val, 0) / minLength;
        const meanJ = returnsJTrimmed.reduce((acc, val) => acc + val, 0) / minLength;
        
        let covariance = 0;
        for (let k = 0; k < minLength; k++) {
          covariance += (returnsITrimmed[k] - meanI) * (returnsJTrimmed[k] - meanJ);
        }
        covariance /= minLength;
        
        // Anualizar a covariância
        covariance *= 252;
        
        covMatrix[i][j] = covariance;
      }
    }
  }
  
  return covMatrix;
}

// Algoritmo de otimização Mean-Variance simplificado
export async function optimizePortfolio(
  etfSymbols: string[],
  riskScore: number,
  fromDate: string,
  toDate: string
): Promise<OptimizationResult> {
  try {
    // Obter dados históricos para cada ETF
    const etfsDataPromises = etfSymbols.map(async (symbol) => {
      try {
        const historicalPrices = await getHistoricalPrices(symbol, fromDate, toDate);
        
        // Verificar se temos dados suficientes
        if (!historicalPrices || historicalPrices.length < 30) {
          return null;
        }
        
        const prices = historicalPrices.map(price => price.close);
        const dailyReturns = calculateDailyReturns(prices);
        const annualizedReturn = calculateAnnualizedReturn(dailyReturns);
        const volatility = calculateVolatility(dailyReturns);
        
        // Determinar domicílio do ETF (simplificado - na prática seria obtido da API)
        const domicile = symbol.includes('-IE') ? 'IE' : 'US';
        
        return {
          symbol,
          returns: dailyReturns,
          annualizedReturn,
          volatility,
          domicile
        };
      } catch (error) {
        console.error(`Erro ao processar ETF ${symbol}:`, error);
        return null;
      }
    });
    
    // Resolver todas as promessas e filtrar ETFs sem dados
    const etfsDataWithNull = await Promise.all(etfsDataPromises);
    const etfsData = etfsDataWithNull.filter(Boolean) as ETFData[];
    
    // Verificar se temos ETFs suficientes para otimização
    if (etfsData.length < 5) {
      throw new Error('Dados insuficientes para otimização');
    }
    
    // Ordenar ETFs por retorno anualizado
    const sortedETFs = [...etfsData].sort((a, b) => b.annualizedReturn - a.annualizedReturn);
    
    // Calcular retorno alvo (80% da média dos top 10 retornos ou todos se menos de 10)
    const topN = Math.min(10, sortedETFs.length);
    const topReturns = sortedETFs.slice(0, topN).map(etf => etf.annualizedReturn);
    const avgTopReturn = topReturns.reduce((acc, ret) => acc + ret, 0) / topReturns.length;
    const targetReturn = avgTopReturn * TARGET_RETURN_FACTOR;
    
    // Calcular matriz de covariância
    const covMatrix = calculateCovarianceMatrix(etfsData);
    
    // Implementação simplificada do algoritmo de otimização
    // Em um cenário real, usaríamos uma biblioteca de otimização como 'quadprog'
    
    // Iniciar com pesos iguais
    let weights: number[] = Array(etfsData.length).fill(1 / etfsData.length);
    
    // Ajustar pesos com base no perfil de risco (1-5)
    // Perfil mais conservador (1-2) prioriza ETFs com menor volatilidade
    // Perfil mais agressivo (4-5) prioriza ETFs com maior retorno
    if (riskScore <= 2) {
      // Ordenar por volatilidade (menor para maior)
      const volatilityRanking = [...etfsData]
        .map((etf, index) => ({ index, volatility: etf.volatility }))
        .sort((a, b) => a.volatility - b.volatility);
      
      // Dar mais peso para ETFs menos voláteis
      for (let i = 0; i < volatilityRanking.length; i++) {
        const factor = 1 - (i / volatilityRanking.length);
        weights[volatilityRanking[i].index] *= (1 + factor);
      }
    } else if (riskScore >= 4) {
      // Ordenar por retorno (maior para menor)
      const returnRanking = [...etfsData]
        .map((etf, index) => ({ index, return: etf.annualizedReturn }))
        .sort((a, b) => b.return - a.return);
      
      // Dar mais peso para ETFs com maior retorno
      for (let i = 0; i < returnRanking.length; i++) {
        const factor = 1 - (i / returnRanking.length);
        weights[returnRanking[i].index] *= (1 + factor);
      }
    }
    
    // Normalizar pesos
    const sumWeights = weights.reduce((acc, w) => acc + w, 0);
    weights = weights.map(w => w / sumWeights);
    
    // Aplicar restrições de peso mínimo e máximo
    let needsRebalance = true;
    let rebalanceCount = 0;
    const maxRebalanceIterations = 10; // Evitar loop infinito
    
    while (needsRebalance && rebalanceCount < maxRebalanceIterations) {
      needsRebalance = false;
      rebalanceCount++;
      
      // Verificar e ajustar pesos mínimos
      for (let i = 0; i < weights.length; i++) {
        if (weights[i] < MIN_WEIGHT && weights[i] > 0) {
          // Se o peso for menor que o mínimo, definir como zero ou mínimo
          if (weights[i] < MIN_WEIGHT / 2) {
            weights[i] = 0;
          } else {
            weights[i] = MIN_WEIGHT;
          }
          needsRebalance = true;
        }
      }
      
      // Verificar e ajustar pesos máximos
      for (let i = 0; i < weights.length; i++) {
        if (weights[i] > MAX_WEIGHT) {
          weights[i] = MAX_WEIGHT;
          needsRebalance = true;
        }
      }
      
      // Renormalizar pesos
      if (needsRebalance) {
        const sumWeights = weights.reduce((acc, w) => acc + w, 0);
        if (sumWeights > 0) {
          weights = weights.map(w => w / sumWeights);
        } else {
          // Se todos os pesos forem zero, distribuir igualmente
          weights = Array(etfsData.length).fill(1 / etfsData.length);
          needsRebalance = false;
        }
      }
    }
    
    // Substituir ETFs US por IE para perfis conservadores (tax aware)
    if (riskScore <= 2) {
      // Mapear ETFs US para equivalentes IE
      const usToIeMap: Record<string, string> = {
        'VTI': 'VUSA-IE',
        'QQQ': 'EQQQ-IE',
        'SPY': 'CSPX-IE',
        // Adicionar mais mapeamentos conforme necessário
      };
      
      // Criar novo objeto de pesos com substituições
      const newWeights: Record<string, number> = {};
      for (let i = 0; i < etfsData.length; i++) {
        const symbol = etfsData[i].symbol;
        const weight = weights[i];
        
        if (weight > 0) {
          if (etfsData[i].domicile === 'US' && usToIeMap[symbol]) {
            // Substituir por equivalente IE
            newWeights[usToIeMap[symbol]] = weight;
          } else {
            newWeights[symbol] = weight;
          }
        }
      }
      
      // Calcular métricas da carteira
      const portfolioReturn = etfsData.reduce((acc, etf, i) => acc + etf.annualizedReturn * weights[i], 0);
      
      // Calcular volatilidade da carteira usando a matriz de covariância
      let portfolioVariance = 0;
      for (let i = 0; i < weights.length; i++) {
        for (let j = 0; j < weights.length; j++) {
          portfolioVariance += weights[i] * weights[j] * covMatrix[i][j];
        }
      }
      const portfolioVolatility = Math.sqrt(portfolioVariance);
      
      // Calcular Sharpe Ratio (assumindo taxa livre de risco de 2%)
      const riskFreeRate = 0.02;
      const sharpeRatio = (portfolioReturn - riskFreeRate) / portfolioVolatility;
      
      return {
        weights: newWeights,
        metrics: {
          return: portfolioReturn,
          volatility: portfolioVolatility,
          sharpe: sharpeRatio
        }
      };
    }
    
    // Criar objeto de pesos final
    const finalWeights: Record<string, number> = {};
    for (let i = 0; i < etfsData.length; i++) {
      if (weights[i] > 0) {
        finalWeights[etfsData[i].symbol] = parseFloat(weights[i].toFixed(4));
      }
    }
    
    // Calcular métricas da carteira
    const portfolioReturn = etfsData.reduce((acc, etf, i) => acc + etf.annualizedReturn * weights[i], 0);
    
    // Calcular volatilidade da carteira usando a matriz de covariância
    let portfolioVariance = 0;
    for (let i = 0; i < weights.length; i++) {
      for (let j = 0; j < weights.length; j++) {
        portfolioVariance += weights[i] * weights[j] * covMatrix[i][j];
      }
    }
    const portfolioVolatility = Math.sqrt(portfolioVariance);
    
    // Calcular Sharpe Ratio (assumindo taxa livre de risco de 2%)
    const riskFreeRate = 0.02;
    const sharpeRatio = (portfolioReturn - riskFreeRate) / portfolioVolatility;
    
    return {
      weights: finalWeights,
      metrics: {
        return: portfolioReturn,
        volatility: portfolioVolatility,
        sharpe: sharpeRatio
      }
    };
  } catch (error) {
    console.error('Erro na otimização do portfólio:', error);
    
    // Retornar uma carteira com pesos iguais para ETFs seguros como fallback
    const fallbackETFs = ['VTI', 'VOO', 'QQQ', 'BND', 'VEA'];
    const equalWeight = 0.2; // 20% cada
    
    const fallbackWeights: Record<string, number> = {};
    fallbackETFs.forEach(symbol => {
      fallbackWeights[symbol] = equalWeight;
    });
    
    return {
      weights: fallbackWeights,
      metrics: {
        return: 0.07, // 7% retorno esperado conservador
        volatility: 0.15, // 15% volatilidade estimada
        sharpe: 0.33 // (7% - 2%) / 15%
      }
    };
  }
}
