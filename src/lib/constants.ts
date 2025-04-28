export const FMP_API_KEY = process.env.FMP_API_KEY || '';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-example';
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iikdiavzocnpspebjasp.supabase.co';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJJUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpaGRpYXZ6b2NucHNwZWJqYXNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNjAxOTY4MCwiZXhwIjoyMDMxNTk1NjgwfQ.c2NucNk_test_abGma&5pd60tbM9VcZUt0DcuY2xlcmsuYmNjb3VudHMuZGV2';
export const MERCADO_PAGO_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
export const POSTHOG_KEY = process.env.POSTHOG_KEY || '';

// Constantes para o algoritmo de otimização
export const MIN_WEIGHT = 0.05; // 5% peso mínimo
export const MAX_WEIGHT = 0.30; // 30% peso máximo
export const TARGET_RETURN_FACTOR = 0.8; // 80% do retorno médio dos top 10 ETFs
