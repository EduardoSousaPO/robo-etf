# Robo-ETF - Carteira Inteligente de ETFs (Refatorado)

Robo-ETF é uma aplicação SaaS que permite criar carteiras globais de ETFs alinhadas ao perfil de risco do usuário, otimizadas em custos e tributação, com relatório explicativo em português. Esta versão foi refatorada para maior robustez e manutenibilidade, utilizando Prisma para acesso ao banco de dados e Clerk para autenticação.

## Tecnologias Utilizadas

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend/API**: Next.js API Routes
- **Banco de Dados**: Supabase (PostgreSQL) via **Prisma ORM**
- **Autenticação**: Clerk (e-mail + Google)
- **Dados Financeiros**: Financial Modeling Prep API (FMP)
- **IA/LLM**: OpenAI (GPT-4o-mini)
- **Geração de PDF**: `pdf-lib`
- **Armazenamento de PDF**: Supabase Storage
- **Pagamentos**: Mercado Pago Subscriptions
- **Testes**: Vitest
- **CI/CD**: GitHub Actions (configuração básica incluída)

## Funcionalidades Principais

- Fluxo de Onboarding com questionário para determinar perfil de risco (1-5).
- Geração de carteira otimizada via algoritmo Mean-Variance.
- Dashboard com visão geral do mercado e tabela de ETFs filtrável.
- Visualização detalhada da carteira (gráficos, alocação).
- Exportação da carteira em CSV.
- Geração e download de relatório da carteira em PDF.
- Explicação da carteira gerada por IA (OpenAI).
- Chat com IA para tirar dúvidas sobre ETFs (OpenAI).
- Sistema de assinatura via Mercado Pago (Freemium com paywall após 1 carteira).
- Rebalanceamento automático (via Cron Job - lógica implementada, requer configuração externa).
- Verificação de Drawdown (via Cron Job - lógica implementada, requer configuração externa).
- Gerenciamento de conta de usuário via Clerk.

## Configuração do Ambiente

Siga estes passos para configurar e executar o projeto localmente (testado com Cursor.ai e VS Code).

### 1. Pré-requisitos

- **Node.js**: Versão 20 ou superior.
- **pnpm**: Gerenciador de pacotes. Instale com `npm install -g pnpm`.
- **Conta Supabase**: Para o banco de dados PostgreSQL e armazenamento de arquivos (Storage).
- **Conta Clerk**: Para autenticação de usuários.
- **Conta OpenAI**: Para as funcionalidades de IA (explicação e chat).
- **Conta Financial Modeling Prep (FMP)**: Para dados financeiros de ETFs.
- **Conta Mercado Pago**: Para processamento de pagamentos de assinatura (obtenha o Access Token).
- **Git**: Para clonar o repositório.

### 2. Clonar o Repositório

```bash
git clone https://github.com/EduardoSousaPO/robo-etf.git # Ou o URL do seu fork
cd robo-etf
```

### 3. Instalar Dependências

Use o pnpm para instalar todas as dependências do projeto:

```bash
pnpm install
```

### 4. Configurar Variáveis de Ambiente

Crie um arquivo chamado `.env.local` na raiz do projeto. Copie o conteúdo abaixo e **substitua os valores placeholder** pelas suas chaves e URLs reais.

```env
# --- Banco de Dados (Supabase via Prisma) ---
# Obtenha no Supabase: Project Settings > Database > Connection string > URI (use a versão Pooling)
# IMPORTANTE: Substitua [YOUR-PASSWORD] pela sua senha do banco Supabase.
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.<project-ref>.supabase.co:5432/postgres?pgbouncer=true"

# --- Autenticação (Clerk) ---
# Obtenha no dashboard do Clerk (clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
# URLs de redirecionamento (ajuste se necessário, mas localhost:3000 é o padrão)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# --- Armazenamento de Arquivos (Supabase Storage) ---
# Obtenha no Supabase: Project Settings > API
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_KEY=eyJ... # Use a chave "service_role" (Secret)

# --- APIs Externas ---
# Obtenha no site da Financial Modeling Prep
FMP_API_KEY=sua_chave_fmp
# Obtenha no site da OpenAI
OPENAI_API_KEY=sk-...
# Obtenha no dashboard do Mercado Pago (Credenciais de Produção ou Teste)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...

# --- Configurações da Aplicação ---
# URL base da sua aplicação em desenvolvimento
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Chave secreta para proteger os endpoints de Cron (crie uma chave segura)
CRON_API_KEY=sua_chave_secreta_para_cron

# --- Observabilidade (Opcional) ---
# Obtenha no site do PostHog
# POSTHOG_KEY=phc_...
# NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Onde obter as chaves:**

- **`DATABASE_URL`**: Vá ao seu projeto Supabase -> Project Settings -> Database -> Connection string. Copie a string `URI` e **substitua `[YOUR-PASSWORD]` pela senha que você definiu para o seu banco de dados Supabase**. Certifique-se de usar a URL com `pgbouncer=true`.
- **Clerk Keys**: Crie uma aplicação no [Clerk](https://dashboard.clerk.com/) e encontre as chaves `Publishable key` e `Secret key` na seção API Keys.
- **Supabase URL & Service Key**: Vá ao seu projeto Supabase -> Project Settings -> API. Copie a `Project URL` e a chave `service_role` (em Project API keys).
- **FMP API Key**: Registre-se no [Financial Modeling Prep](https://site.financialmodelingprep.com/) e obtenha sua chave de API.
- **OpenAI API Key**: Crie uma conta na [OpenAI Platform](https://platform.openai.com/) e gere uma chave de API.
- **Mercado Pago Access Token**: Crie uma aplicação no [Mercado Pago Developers](https://www.mercadopago.com.br/developers) e obtenha seu `Access Token` (de produção ou teste).
- **`CRON_API_KEY`**: Gere uma string aleatória segura e forte. Você usará essa chave para autorizar chamadas aos endpoints de Cron.

### 5. Configurar Banco de Dados Supabase

O schema do banco de dados é gerenciado pelo Prisma. As tabelas necessárias (`Profile`, `Portfolio`) já estão definidas em `prisma/schema.prisma`.

1.  **Conecte-se ao seu banco de dados Supabase** usando uma ferramenta de sua preferência (como o SQL Editor do próprio Supabase, DBeaver, TablePlus, etc.) usando a URL de conexão direta (sem pgbouncer) encontrada em Project Settings > Database.
2.  **Execute o script SQL inicial:** Copie o conteúdo do arquivo `migrations/0001_initial.sql` e execute-o no seu banco de dados Supabase. Isso criará as tabelas `profiles` e `portfolios`.

    *Observação: Alternativamente, você poderia usar `npx prisma db push` após configurar o `.env.local`, mas executar o SQL manualmente garante que as políticas RLS e outras configurações específicas do Supabase sejam aplicadas corretamente se você as tiver definido.* 

### 6. Configurar Supabase Storage

Siga estes passos no painel do seu projeto Supabase:

1.  Vá para a seção **Storage** (ícone de balde no menu lateral).
2.  Clique em **"Create bucket"**.
3.  Nomeie o bucket exatamente como: `portfolio-pdfs`.
4.  **Desmarque** a opção "Public bucket".
5.  Clique em **"Create bucket"**.
6.  Clique no bucket `portfolio-pdfs` recém-criado.
7.  Vá para a aba **"Policies"**.
8.  Clique em **"New Policy"** -> **"Create a new policy from scratch"**.
9.  **Policy name:** `Public Read Access for PDFs`
10. **Allowed operations:** Marque apenas `SELECT`.
11. **Target roles:** Marque `anon`.
12. **Policy definition (SQL):** Verifique se o SQL gerado é semelhante a:
    ```sql
    CREATE POLICY "Public Read Access for PDFs" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'portfolio-pdfs');
    ```
13. Clique em **"Review"** e depois em **"Save policy"**.

### 7. Gerar Cliente Prisma

Após configurar o `DATABASE_URL` no `.env.local`, gere o Prisma Client:

```bash
npx prisma generate
```

## Execução Local (Desenvolvimento)

Com todas as configurações concluídas, inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

**Para usuários do Cursor.ai:**

- Abra o projeto no Cursor.ai.
- Abra o terminal integrado (Terminal > New Terminal).
- Siga os passos de instalação (`pnpm install`) e configuração (`.env.local`, banco de dados, storage) conforme descrito acima.
- Execute `pnpm dev` no terminal.
- Acesse [http://localhost:3000](http://localhost:3000) no seu navegador ou use a funcionalidade de preview/porta do Cursor.ai se disponível.

## Execução de Testes

Para rodar os testes unitários e de integração (usando Vitest):

```bash
pnpm test
```

## Estrutura do Projeto (Refatorado)

```
robo-etf/
├── migrations/              # Script SQL inicial para o banco
├── prisma/                  # Configuração do Prisma ORM
│   └── schema.prisma        # Definição do schema do banco de dados
├── public/                  # Arquivos estáticos
├── src/
│   ├── app/                 # Páginas e Layouts (App Router)
│   │   ├── (auth)/          # Rotas de autenticação (sign-in, sign-up)
│   │   ├── (main)/          # Rotas principais após login (dashboard, portfolio, account)
│   │   ├── api/             # Rotas da API (backend)
│   │   │   ├── chat/
│   │   │   ├── cron/        # Endpoints para Cron Jobs (rebalance, drawdown)
│   │   │   ├── explain/
│   │   │   ├── mercadopago/
│   │   │   ├── optimize/
│   │   │   ├── pdf/
│   │   │   ├── profile/
│   │   │   └── subscription/
│   │   ├── onboarding/      # Página de onboarding após registro
│   │   └── layout.tsx       # Layout principal
│   │   └── page.tsx         # Landing page
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── account/         # Componentes da página de conta
│   │   ├── chat/            # Componente do widget de chat
│   │   ├── dashboard/       # Componentes do dashboard (filtros, tabela, overview)
│   │   ├── portfolio/       # Componente de exibição da carteira
│   │   └── ui/              # Componentes base de UI (shadcn/ui)
│   ├── lib/                 # Funções utilitárias e lógica de negócios
│   │   ├── constants.ts     # Constantes
│   │   ├── db.ts            # Instância global do Prisma Client
│   │   ├── drawdown.ts      # Lógica de verificação de drawdown
│   │   ├── etf-data.ts      # Funções para buscar dados de ETFs (simulado/real)
│   │   ├── fmp.ts           # Integração com API FMP
│   │   ├── mercadopago.ts   # Integração com Mercado Pago SDK
│   │   ├── openai.ts        # Integração com OpenAI API
│   │   ├── optim.ts         # Lógica de otimização de portfólio
│   │   ├── pdf-generator.ts # Lógica de criação do conteúdo do PDF
│   │   ├── rebalance.ts     # Lógica de rebalanceamento
│   │   ├── repository.ts    # Funções de acesso ao banco de dados (usando Prisma)
│   │   └── utils.ts         # Funções utilitárias gerais
│   ├── hooks/               # Hooks React customizados
│   ├── middleware.ts        # Middleware Next.js (para autenticação Clerk)
│   └── types/               # Definições de tipos TypeScript
├── tests/                   # Arquivos de teste (Vitest)
├── .env.local               # Arquivo de variáveis de ambiente (NÃO COMMITAR)
├── .gitignore               # Arquivos ignorados pelo Git
├── components.json          # Configuração shadcn/ui
├── next.config.mjs          # Configuração do Next.js
├── package.json             # Dependências e scripts do projeto
├── pnpm-lock.yaml           # Lockfile do pnpm
├── postcss.config.js        # Configuração do PostCSS
├── README.md                # Este arquivo
├── tailwind.config.ts       # Configuração do Tailwind CSS
└── tsconfig.json            # Configuração do TypeScript
```

## Diretrizes de Implantação (Ex: Vercel)

1.  **Conecte seu Repositório:** Importe seu projeto Git (GitHub, GitLab, Bitbucket) para a Vercel.
2.  **Configuração do Build:** A Vercel geralmente detecta o Next.js automaticamente.
    - **Build Command:** `pnpm build` (ou deixe o padrão se a Vercel detectar `pnpm`)
    - **Install Command:** `pnpm install`
3.  **Variáveis de Ambiente:** Configure **todas** as variáveis de ambiente definidas no seu `.env.local` nas configurações do projeto na Vercel (Project Settings > Environment Variables). **Não use o arquivo `.env.local` em produção.**
4.  **Banco de Dados:** Certifique-se de que a variável `DATABASE_URL` na Vercel aponte para o seu banco de dados Supabase de produção.
5.  **Cron Jobs:** Para as funcionalidades de rebalanceamento e drawdown, configure Cron Jobs na Vercel (ou outro serviço de agendamento) para chamar os endpoints `/api/cron/rebalance` e `/api/cron/drawdown` periodicamente (ex: diariamente ou semanalmente). Lembre-se de incluir o `CRON_API_KEY` no cabeçalho `Authorization` das requisições: `Authorization: Bearer sua_chave_secreta_para_cron`.
6.  **Webhooks:** Configure os webhooks do Clerk e do Mercado Pago para apontarem para os endpoints correspondentes na sua URL de produção (ex: `https://seu-dominio.com/api/clerk/webhook`, `https://seu-dominio.com/api/mercadopago/webhook`).

## Licença

O código-fonte deste projeto é fornecido como está. As dependências utilizadas geralmente possuem licenças permissivas (MIT, ISC, etc.), mas verifique as licenças individuais se necessário para uso comercial.

