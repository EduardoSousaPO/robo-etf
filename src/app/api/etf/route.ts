import { NextRequest, NextResponse } from 'next/server';
import { getETFsByRegion, getETFQuotes } from '@/lib/yfinance-adapter';
import { ETF, ETFQuote } from '@/lib/api-types';

export async function GET(req: NextRequest) {
  try {
    console.log('Recebendo requisição na API de ETFs');
    const { searchParams } = new URL(req.url);
    
    const category = searchParams.get('category') || 'all';
    const region = searchParams.get('region') || 'global';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    console.log(`Buscando ETFs: região=${region}, limite=${limit}`);
    
    try {
      // Buscar ETFs pela região usando a API Python/FMP
      const etfs = await getETFsByRegion(region);
      
      if (!etfs || etfs.length === 0) {
        console.log('Nenhum ETF encontrado para esta região');
        return NextResponse.json([]);
      }
      
      // Limitar resultados
      const limitedEtfs = etfs.slice(0, limit);
      
      // Obter cotações para os ETFs limitados
      const symbols = limitedEtfs.map(etf => etf.symbol);
      console.log(`Buscando cotações para ${symbols.length} ETFs`);
      
      try {
        if (symbols.length > 0) {
          const quotes = await getETFQuotes(symbols);
          
          // Combinar dados de ETFs com cotações
          const result = limitedEtfs.map(etf => {
            const quote = quotes.find(q => q.symbol === etf.symbol) || { 
              symbol: etf.symbol,
              price: 0,
              changesPercentage: 0,
              volume: 0,
              change: 0,
              beta: 0
            };
            
            return {
              ...etf,
              price: quote.price || etf.price || 0,
              change: quote.changesPercentage || 0,
              volume: quote.volume || 0,
              category: getCategoryForETF(etf.symbol)
            };
          });
          
          console.log(`Retornando ${result.length} ETFs`);
          return NextResponse.json(result);
        }
      } catch (quoteError) {
        console.error('Erro ao buscar cotações:', quoteError);
        // Continuar com etfs sem cotações
        const fallbackResults = limitedEtfs.map(etf => ({
          ...etf,
          category: getCategoryForETF(etf.symbol)
        }));
        
        console.log(`Retornando ${fallbackResults.length} ETFs (sem cotações)`);
        return NextResponse.json(fallbackResults);
      }
      
      return NextResponse.json(limitedEtfs);
    } catch (etfError) {
      console.error('Erro ao buscar ETFs:', etfError);
      // Retornar lista vazia com erro
      return NextResponse.json(
        { error: `Erro ao buscar ETFs: ${(etfError as Error).message}` }, 
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Erro na API de ETFs:', error);
    return NextResponse.json(
      { error: `Erro ao processar requisição: ${(error as Error).message}` }, 
      { status: 500 }
    );
  }
}

// Função auxiliar para determinar a categoria do ETF com base no símbolo
function getCategoryForETF(symbol: string): string {
  const categories: Record<string, string[]> = {
    'US Equity': ['SPY', 'VOO', 'VTI', 'QQQ', 'IVV'],
    'International': ['VXUS', 'EFA', 'VEA', 'IEFA', 'EEM', 'VWO'],
    'Fixed Income': ['AGG', 'BND', 'VCIT', 'VCSH', 'LQD', 'MBB'],
    'Sector': ['XLF', 'XLV', 'XLE', 'XLK', 'XLI', 'XLU', 'XLY'],
    'Commodity': ['GLD', 'IAU', 'SLV', 'USO', 'DBC'],
    'Dividend': ['VYM', 'SCHD', 'HDV', 'DVY', 'SPHD', 'SPYD'],
    'Growth': ['VUG', 'IWF', 'SCHG', 'VONG', 'SPYG'],
    'Value': ['VTV', 'IWD', 'SCHV', 'VONV', 'SPYV']
  };
  
  for (const [category, symbols] of Object.entries(categories)) {
    if (symbols.includes(symbol)) {
      return category;
    }
  }
  
  return 'Other';
} 