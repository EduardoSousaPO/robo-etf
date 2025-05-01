// Constantes de API e chaves de serviço
// Para produção, garantir que todas estas variáveis estejam configuradas no .env.local ou no host
export const FMP_API_KEY = process.env.FMP_API_KEY || '';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// URL da API Python
export const PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:5000';
console.log(`API Python configurada em: ${PYTHON_API_URL}`);

// Constantes do Supabase
// Em produção, estas devem apontar para seu projeto Supabase de produção
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iikdiavzocnpspebjasp.supabase.co';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2RpYXZ6b2NucHNwZWJqYXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MTc1NzQsImV4cCI6MjA2MTE5MzU3NH0.WLBS9-isTcTbGr7OE1GCRQZN58nPxeHVpY5B4Sjpn-0';

// A chave de serviço deve ser usada apenas no backend e NUNCA exposta no frontend
// Esta chave possui permissões elevadas, então deve ser armazenada com segurança
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// Chaves de serviços de pagamento e análise
export const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
export const POSTHOG_KEY = process.env.POSTHOG_KEY || '';

// Constantes para o algoritmo de otimização
export const MIN_WEIGHT = 0.05; // 5% peso mínimo
export const MAX_WEIGHT = 0.30; // 30% peso máximo
export const TARGET_RETURN_FACTOR = 0.8; // 80% do retorno médio dos top 10 ETFs

// Verificação em ambiente de desenvolvimento para alertar sobre variáveis ausentes
if (process.env.NODE_ENV !== 'production') {
  const missingVars = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  if (missingVars.length > 0) {
    console.warn('⚠️ Variáveis de ambiente ausentes:', missingVars.join(', '));
    console.warn('Usando valores padrão para desenvolvimento apenas.');
  }
}

