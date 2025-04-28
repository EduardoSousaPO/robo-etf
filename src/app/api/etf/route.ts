import { NextRequest, NextResponse } from 'next/server';
import { getFilteredETFs } from '@/lib/etf-data';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    const category = searchParams.get('category') || 'all';
    const region = searchParams.get('region') || 'global';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const view = searchParams.get('view') || 'list';
    
    // Construir objeto de filtro a partir dos parâmetros
    const filter: Record<string, any> = {};
    
    if (searchParams.has('minPrice')) {
      filter.minPrice = parseFloat(searchParams.get('minPrice') || '0');
    }
    
    if (searchParams.has('maxPrice')) {
      filter.maxPrice = parseFloat(searchParams.get('maxPrice') || '1000');
    }
    
    // Verificar se há símbolos específicos para filtrar
    if (searchParams.has('symbols')) {
      const symbolsParam = searchParams.get('symbols') || '';
      filter.symbols = symbolsParam.split(',').filter(Boolean);
    }
    
    // Obter ETFs filtrados
    const etfs = await getFilteredETFs(category, region, limit, filter);
    
    return NextResponse.json(etfs);
  } catch (error) {
    console.error('Erro na API de ETFs:', error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
} 