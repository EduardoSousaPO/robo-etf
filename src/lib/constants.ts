export const FMP_API_KEY = process.env.FMP_API_KEY || '';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const SUPABASE_URL = process.env.SUPABASE_URL || '';
export const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
export const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || '';
export const NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
export const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
export const POSTHOG_KEY = process.env.POSTHOG_KEY || '';

// Constantes para o algoritmo de otimização
export const MIN_WEIGHT = 0.05; // 5% peso mínimo
export const MAX_WEIGHT = 0.30; // 30% peso máximo
export const TARGET_RETURN_FACTOR = 0.8; // 80% do retorno médio dos top 10 ETFs
