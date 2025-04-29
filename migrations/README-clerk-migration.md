# Migração de Autenticação Supabase → Clerk

Este documento contém as instruções para completar a migração da autenticação do Supabase para o Clerk no projeto Robo-ETF.

## Pré-requisitos

1. Conta ativa no [Clerk](https://clerk.com)
2. Acesso administrativo ao projeto Supabase
3. Acesso ao código-fonte do projeto

## Passos para Configuração do Clerk

### 1. Criar Aplicativo no Clerk

1. Acesse o [Dashboard do Clerk](https://dashboard.clerk.com)
2. Clique em **Add Application**
3. Nomeie o aplicativo como "Robo-ETF"
4. Selecione a região mais próxima do seu público-alvo
5. Ative os seguintes métodos de autenticação:
   - Email/Password
   - Google OAuth

### 2. Configurar Template JWT para Supabase

1. No dashboard do Clerk, navegue até **JWT Templates**
2. Clique em **New Template**
3. Nomeie como "supabase-jwt"
4. Configure os Claims com o seguinte JSON:
   ```json
   {
     "sub": "{{user.id}}",
     "email": "{{user.primary_email_address.email_address}}",
     "role": "authenticated"
   }
   ```
5. Mantenha a opção de assinatura como **RS256**
6. Copie o `JWT_TEMPLATE_ID` gerado

### 3. Configurar Webhook para Sincronização com Supabase

1. No dashboard do Clerk, navegue até **Webhooks**
2. Clique em **Add Endpoint**
3. Configure:
   - URL: `https://[seu-domínio]/api/webhooks/clerk`
   - Eventos: `user.created`, `user.updated`, `user.deleted`
4. Copie o `WEBHOOK_SECRET` gerado

### 4. Copiar Chaves de API

No dashboard do Clerk, navegue até **API Keys** e copie:

- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

## Configuração do Ambiente

### 1. Variáveis de Ambiente

Atualize o arquivo `.env.local` (para desenvolvimento) e as variáveis de ambiente na sua plataforma de hospedagem:

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_JWT_TEMPLATE_ID=jwt_template_id...
CLERK_WEBHOOK_SECRET=whsec_...

# Supabase (mantido para o banco de dados)
NEXT_PUBLIC_SUPABASE_URL=https://[seu-projeto].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[chave-anon]
SUPABASE_SERVICE_ROLE_KEY=[chave-service-role]
```

### 2. Configurar o Banco de Dados Supabase

Execute o script SQL fornecido `clerk-supabase-integration.sql` no SQL Editor do Supabase para configurar:

- Tabela `profiles` (se não existir)
- Políticas de Row Level Security (RLS)
- Funções e triggers necessários

## Verificações pós-migração

### 1. Fluxo de autenticação

- **Teste de Cadastro**: Complete o fluxo de cadastro e verifique se o usuário é criado no Clerk e se o perfil correspondente é criado no Supabase.
- **Teste de Login**: Verifique se o login funciona corretamente e se o usuário pode acessar áreas protegidas.
- **Teste de Logout**: Confirme se o logout funciona e se as sessões são invalidadas.

### 2. Sincronização de dados

- Verifique no painel do Supabase se os novos usuários estão tendo perfis criados automaticamente.
- Verifique se as atualizações de perfil no Clerk (como mudança de e-mail) são propagadas para o Supabase.

### 3. Acesso ao banco de dados

- Verifique se as consultas ao banco de dados estão funcionando corretamente com as novas políticas de RLS.
- Confirme que apenas usuários autenticados podem acessar seus próprios dados.

## Rollback (Em caso de problemas)

Para reverter para o Supabase Auth:

1. Revertendo o código:

   ```bash
   git revert [commit-id-da-migração]
   ```

2. Atualize as variáveis de ambiente para usar apenas o Supabase.

## Migração de usuários existentes (opcional)

Se você precisar migrar usuários existentes do Supabase para o Clerk:

1. Exporte os usuários do Supabase Auth usando as APIs ou o console.
2. Use a API do Clerk para criar usuários correspondentes.
3. Atualize os IDs dos usuários na tabela `profiles` para corresponder aos novos IDs do Clerk.

## Suporte

Em caso de problemas com a integração:

- [Documentação do Clerk](https://clerk.com/docs)
- [Documentação do Supabase](https://supabase.com/docs)
