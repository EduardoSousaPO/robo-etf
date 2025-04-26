-- Criação das tabelas para o Robo-ETF
-- Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  risk_score INT, -- 1 a 5
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de carteiras de investimento
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  weights JSONB, -- {"QQQ":0.15,"VTI":0.20,...}
  metrics JSONB, -- ret, vol, sharpe
  rebalance_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_risk_score ON profiles(risk_score);
