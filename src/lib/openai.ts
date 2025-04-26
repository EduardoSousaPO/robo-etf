import OpenAI from 'openai';
import { OPENAI_API_KEY } from './constants';

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Tipo para a carteira otimizada
type Portfolio = {
  weights: Record<string, number>;
  metrics: {
    return: number;
    volatility: number;
    sharpe: number;
  };
  rebalance_date: string;
};

// Função para explicar a alocação da carteira
export async function explainAllocation(
  portfolio: Portfolio,
  riskScore: number
): Promise<string> {
  try {
    // Preparar os dados da carteira para o prompt
    const topETFs = Object.entries(portfolio.weights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([symbol, weight]) => `${symbol}: ${(weight * 100).toFixed(2)}%`);
    
    const metrics = {
      return: (portfolio.metrics.return * 100).toFixed(2) + '%',
      volatility: (portfolio.metrics.volatility * 100).toFixed(2) + '%',
      sharpe: portfolio.metrics.sharpe.toFixed(2),
      rebalanceDate: new Date(portfolio.rebalance_date).toLocaleDateString('pt-BR'),
    };
    
    // Definir o perfil de risco
    const riskProfiles = [
      'muito conservador',
      'conservador',
      'moderado',
      'arrojado',
      'muito arrojado',
    ];
    
    const profileName = riskProfiles[riskScore - 1];
    
    // Criar o prompt para o OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um consultor financeiro especializado em ETFs globais. 
          Explique de forma clara e concisa (máximo 250 palavras) por que a carteira foi montada dessa forma, 
          considerando o perfil de risco do investidor e as características dos ETFs selecionados. 
          Use linguagem acessível para investidores brasileiros. Mencione aspectos de diversificação, 
          exposição geográfica/setorial e eficiência tributária quando relevante.`,
        },
        {
          role: 'user',
          content: `Explique esta carteira de ETFs para um investidor brasileiro com perfil ${profileName} (score ${riskScore}/5).
          
          Top ETFs:
          ${topETFs.join('\n')}
          
          Métricas:
          - Retorno esperado: ${metrics.return}
          - Volatilidade: ${metrics.volatility}
          - Índice Sharpe: ${metrics.sharpe}
          - Data de rebalanceamento: ${metrics.rebalanceDate}
          
          ${riskScore <= 2 ? 'Observe que para este perfil conservador, priorizamos ETFs domiciliados na Irlanda (sufixo -IE) para otimização tributária.' : ''}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      function_call: 'none',
    });
    
    return response.choices[0].message.content || 'Não foi possível gerar uma explicação.';
  } catch (error) {
    console.error('Erro ao gerar explicação com OpenAI:', error);
    
    // Fallback para explicação genérica em caso de erro
    return generateFallbackExplanation(portfolio, riskScore);
  }
}

// Função para gerar explicação de fallback em caso de erro com a API OpenAI
function generateFallbackExplanation(portfolio: Portfolio, riskScore: number): string {
  const riskProfiles = [
    'muito conservador',
    'conservador',
    'moderado',
    'arrojado',
    'muito arrojado',
  ];
  
  const profileName = riskProfiles[riskScore - 1];
  const topETFs = Object.entries(portfolio.weights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([symbol]) => symbol);
  
  return `Sua carteira foi otimizada para um perfil ${profileName}, com foco em ${
    riskScore <= 2 ? 'preservação de capital e menor volatilidade' : 
    riskScore === 3 ? 'equilíbrio entre risco e retorno' : 
    'crescimento e maior potencial de retorno'
  }.

Os ETFs com maior peso na sua carteira são ${topETFs.join(', ')}, selecionados por ${
    riskScore <= 2 ? 'seu histórico de estabilidade e menor correlação com mercados voláteis' : 
    riskScore === 3 ? 'seu equilíbrio entre crescimento e estabilidade' : 
    'seu potencial de crescimento e exposição a setores de alto desempenho'
  }.

${
  riskScore <= 2 ? 
  'Para otimização tributária, priorizamos ETFs domiciliados na Irlanda (sufixo -IE) que oferecem vantagens fiscais para investidores brasileiros.' : 
  'A carteira prioriza ETFs com maior liquidez e histórico consistente de desempenho.'
}

O retorno anualizado esperado é de ${(portfolio.metrics.return * 100).toFixed(2)}%, com volatilidade de ${(portfolio.metrics.volatility * 100).toFixed(2)}% e índice Sharpe de ${portfolio.metrics.sharpe.toFixed(2)}.

Recomendamos revisar e rebalancear sua carteira em ${new Date(portfolio.rebalance_date).toLocaleDateString('pt-BR')}, ou antes caso ocorra uma queda superior a 15% no valor total.`;
}
