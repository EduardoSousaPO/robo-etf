-- Script para configurar o banco de dados Supabase para integração com Clerk
-- Para executar, acesse o SQL Editor no painel do Supabase e execute este script

-- Verificar se já existe a tabela de perfis
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    -- Criar a tabela de perfis se não existir
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY,
      email TEXT,
      name TEXT,
      risk_score NUMERIC,
      subscription_status TEXT DEFAULT 'free',
      subscription_id TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ
    );

    -- Comentários nas colunas para melhor documentação
    COMMENT ON TABLE public.profiles IS 'Perfis de usuários gerenciados pelo Clerk';
    COMMENT ON COLUMN public.profiles.id IS 'ID do usuário no Clerk';
    COMMENT ON COLUMN public.profiles.email IS 'Endereço de e-mail principal do usuário';
    COMMENT ON COLUMN public.profiles.name IS 'Nome completo do usuário';
    COMMENT ON COLUMN public.profiles.risk_score IS 'Pontuação de risco do usuário (1-10)';
    COMMENT ON COLUMN public.profiles.subscription_status IS 'Status da assinatura (free/premium)';
    COMMENT ON COLUMN public.profiles.subscription_id IS 'ID da assinatura no provedor de pagamentos';
    COMMENT ON COLUMN public.profiles.is_active IS 'Se o usuário está ativo ou foi "deletado"';
  ELSE
    -- Se a tabela já existe, verifica e adiciona novas colunas necessárias
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_active') THEN
      ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
      ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ;
    END IF;
  END IF;
END $$;

-- Configuração de Row Level Security (RLS)
-- Ativar RLS para a tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Usuários podem ver apenas seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem editar apenas seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Acesso de Admin aos perfis" ON public.profiles;

-- Criar novas políticas RLS
-- Política para leitura: usuários podem ver apenas seu próprio perfil
CREATE POLICY "Usuários podem ver apenas seus próprios perfis"
  ON public.profiles
  FOR SELECT
  USING (id::text = auth.uid()::text);

-- Política para atualização: usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Usuários podem editar apenas seus próprios perfis"
  ON public.profiles
  FOR UPDATE
  USING (id::text = auth.uid()::text);

-- Política para admins: acesso total via service_role
CREATE POLICY "Acesso de Admin aos perfis"
  ON public.profiles
  USING (auth.role() = 'service_role');

-- Verifique se já existe a tabela portfolios
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'portfolios') THEN
    -- Criar tabela de carteiras de investimento
    CREATE TABLE public.portfolios (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES public.profiles(id) NOT NULL,
      weights JSONB NOT NULL,
      metrics JSONB NOT NULL,
      rebalance_date TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ
    );

    -- Comentários nas colunas
    COMMENT ON TABLE public.portfolios IS 'Carteiras de ETFs dos usuários';
    COMMENT ON COLUMN public.portfolios.id IS 'ID único da carteira';
    COMMENT ON COLUMN public.portfolios.user_id IS 'ID do usuário dono da carteira';
    COMMENT ON COLUMN public.portfolios.weights IS 'Alocação percentual em cada ETF';
    COMMENT ON COLUMN public.portfolios.metrics IS 'Métricas de desempenho (retorno, volatilidade, sharpe)';
    COMMENT ON COLUMN public.portfolios.rebalance_date IS 'Data da última recomendação de rebalanceamento';
  ELSE 
    -- Se a tabela já existe, verifica e adiciona novas colunas necessárias
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'portfolios' AND column_name = 'updated_at') THEN
      ALTER TABLE public.portfolios ADD COLUMN updated_at TIMESTAMPTZ;
    END IF;
  END IF;
END $$;

-- Ativar RLS para a tabela portfolios
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Usuários podem ver apenas suas carteiras" ON public.portfolios;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias carteiras" ON public.portfolios;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias carteiras" ON public.portfolios;
DROP POLICY IF EXISTS "Acesso de Admin às carteiras" ON public.portfolios;

-- Criar novas políticas RLS para portfolios
-- Política para leitura: usuários podem ver apenas suas próprias carteiras
CREATE POLICY "Usuários podem ver apenas suas carteiras"
  ON public.portfolios
  FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Política para inserção: usuários podem criar carteiras para si mesmos
CREATE POLICY "Usuários podem criar suas próprias carteiras"
  ON public.portfolios
  FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Política para atualização: usuários podem atualizar apenas suas próprias carteiras
CREATE POLICY "Usuários podem atualizar suas próprias carteiras"
  ON public.portfolios
  FOR UPDATE
  USING (user_id::text = auth.uid()::text);

-- Política para admins: acesso total via service_role
CREATE POLICY "Acesso de Admin às carteiras"
  ON public.portfolios
  USING (auth.role() = 'service_role');

-- Criar função para atualizar o timestamp
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar trigger para atualizar o timestamp na tabela profiles
DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;
CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Adicionar trigger para atualizar o timestamp na tabela portfolios
DROP TRIGGER IF EXISTS update_portfolios_timestamp ON public.portfolios;
CREATE TRIGGER update_portfolios_timestamp
BEFORE UPDATE ON public.portfolios
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp(); 