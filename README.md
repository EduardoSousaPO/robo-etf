# Robo-ETF - Carteira Inteligente de ETFs

Robo-ETF é uma aplicação SaaS que permite criar carteiras globais de ETFs alinhadas ao perfil de risco do usuário, otimizadas em custos e tributação, com relatório explicativo em português.

## Tecnologias Utilizadas

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend**: Node/Fastify (Edge-ready) + Supabase Postgres
- **Autenticação**: Clerk (e-mail + Google)
- **Dados Financeiros**: Financial Modeling Prep API (FMP)
- **IA/LLM**: OpenAI (GPT-4o-mini) + function-calling
- **PDFs**: react-pdf / @react-pdf/renderer
- **Pagamentos**: Mercado Pago Subscriptions
- **Deploy**: Vercel (Preview + Prod)
- **Observabilidade**: Vercel Analytics + PostHog
- **CI/CD**: GitHub Actions (lint, test, build, deploy)

## Funcionalidades Principais

- Questionário de 6 perguntas para determinar o perfil de risco do usuário
- Algoritmo Mean-Variance para otimização de carteiras de ETFs
- Visualização da carteira com gráficos e métricas detalhadas
- Exportação em CSV e PDF
- Explicação da carteira gerada por IA em português
- Rebalanceamento automático a cada 6 meses ou após drawdown > 15%
- Plano Freemium com paywall após 1 carteira

## Configuração do Ambiente

### Pré-requisitos

- Node.js 20+
- pnpm 10+
- Conta Supabase
- Conta Clerk
- Conta OpenAI
- Conta Financial Modeling Prep
- Conta Mercado Pago (para processamento de pagamentos)

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```
# API Keys
FMP_API_KEY=sua_chave_fmp
OPENAI_API_KEY=sua_chave_openai
MERCADO_PAGO_ACCESS_TOKEN=seu_token_mercado_pago
POSTHOG_KEY=sua_chave_posthog

# Supabase
SUPABASE_URL=sua_url_supabase
SUPABASE_SERVICE_KEY=sua_chave_servico_supabase

# Clerk
CLERK_SECRET_KEY=sua_chave_secreta_clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=sua_chave_publica_clerk

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_API_KEY=chave_para_endpoints_cron
```

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/robo-etf.git
cd robo-etf

# Instalar dependências
pnpm install

# Configurar banco de dados
pnpm supabase:setup

# Iniciar servidor de desenvolvimento
pnpm dev
```

## Estrutura do Projeto

```
robo-etf/
├── migrations/              # Migrações do banco de dados Supabase
├── public/                  # Arquivos estáticos
├── src/
│   ├── app/                 # Páginas Next.js (App Router)
│   │   ├── account/         # Página de conta do usuário
│   │   ├── api/             # Rotas da API
│   │   ├── onboarding/      # Questionário de perfil
│   │   ├── portfolio/       # Visualização da carteira
│   │   └── page.tsx         # Landing page
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── forms/           # Componentes de formulário
│   │   └── ui/              # Componentes de UI
│   └── lib/                 # Funções utilitárias
│       ├── constants.ts     # Constantes da aplicação
│       ├── fmp.ts           # Integração com Financial Modeling Prep
│       ├── mercadopago.ts   # Integração com Mercado Pago
│       ├── openai.ts        # Integração com OpenAI
│       ├── optim.ts         # Algoritmo de otimização
│       ├── pdf-generator.ts # Gerador de PDF
│       ├── rebalance.ts     # Lógica de rebalanceamento
│       └── supabase.ts      # Cliente Supabase
└── tests/                   # Testes unitários e E2E
```

## Algoritmo de Otimização

O algoritmo Mean-Variance implementado segue os seguintes passos:

1. Seleciona 80 ETFs líquidos (volume > 10M/dia)
2. Calcula retorno anualizado de 5 anos e desvio-padrão
3. Define target return como 80% da média dos top 10 retornos
4. Resolve min σ dado target return (restrição: 5% ≤ w ≤ 30%)
5. Para perfis conservadores (risk_score ≤ 2), substitui ETFs US-domiciled por equivalentes IE-domiciled para otimização tributária

## Endpoints da API

### POST /api/optimize

Otimiza uma carteira de ETFs com base no perfil de risco.

**Request:**
```json
{
  "riskScore": 3
}
```

**Response:**
```json
{
  "weights": {
    "VTI": 0.25,
    "QQQ": 0.20,
    "...": "..."
  },
  "metrics": {
    "return": 0.085,
    "volatility": 0.15,
    "sharpe": 0.43
  },
  "rebalance_date": "2025-10-25"
}
```

### POST /api/explain

Gera uma explicação da carteira usando IA.

**Request:**
```json
{
  "portfolio": {
    "weights": { "..." },
    "metrics": { "..." }
  },
  "riskScore": 3
}
```

**Response:**
```json
{
  "explanation": "Sua carteira foi otimizada para um perfil moderado..."
}
```

### POST /api/pdf

Gera um PDF da carteira.

**Request:**
```json
{
  "portfolio": { "..." },
  "riskScore": 3,
  "explanation": "..."
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://..."
}
```

### POST /api/subscription

Cria uma assinatura no Mercado Pago.

**Response:**
```json
{
  "success": true,
  "subscription_id": "...",
  "init_point": "https://..."
}
```

## Testes

```bash
# Executar testes unitários
pnpm test

# Executar testes E2E
pnpm test:e2e
```

## Deploy

```bash
# Build para produção
pnpm build

# Deploy na Vercel
vercel --prod
```

## Licença

Todos os pacotes utilizados têm licença MIT/ISC ou equivalente gratuita para uso comercial.
