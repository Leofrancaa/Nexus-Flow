-- =============================================================================
-- Nexus Flow — schema completo para um projeto Supabase novo.
--
-- Rode este arquivo inteiro no SQL Editor, de uma vez. Ele é idempotente
-- (`IF NOT EXISTS` em tudo), então rodar duas vezes não quebra nada.
--
-- Origem de cada bloco:
--   1..3  as migrations `drizzle/0000..0004`, já sem o que o `0006` derruba
--   4     `expense_history`, que existe em produção mas não em nenhuma migration
--   5     Pluggy (`drizzle/0005_pluggy.sql`) — tabelas ainda vazias, o código
--         que as preenche é o bloco 5 do ROADMAP
--
-- Ficaram de fora, de propósito:
--   `recurring_expenses` — nenhuma linha do código a referencia;
--   `import_batches` e `imported_transactions` — o importador de extrato saiu,
--     quem traz transação agora é a Pluggy;
--   `career_profile`, `career_milestones`, `study_items`, `personal_goals` —
--     módulos não-financeiros removidos no bloco 4.
-- Se você já tem um banco antigo com essas tabelas, rode o
-- `drizzle/0006_remove_import_and_personal.sql` para derrubá-las.
--
-- As FKs abaixo não vêm das migrations do drizzle (que não as declaram) e sim
-- do banco de produção, que as tem. Se um dia `npm run db:push` propuser
-- removê-las, recuse — elas são a rede de proteção contra lançamento órfão.
-- =============================================================================

-- ---------------------------------------------------------------- 1. núcleo --

CREATE TABLE IF NOT EXISTS users (
  id                     serial PRIMARY KEY,
  nome                   text NOT NULL,
  email                  text NOT NULL UNIQUE,
  senha                  text,
  currency               text DEFAULT 'BRL' NOT NULL,
  accepted_terms         boolean DEFAULT false NOT NULL,
  accepted_terms_at      timestamp,
  reset_password_token   text,
  reset_password_expires timestamp,
  email_verified         boolean DEFAULT false NOT NULL,
  verification_token     text,
  verification_expires   timestamp,
  created_at             timestamp DEFAULT now() NOT NULL,
  updated_at             timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id         serial PRIMARY KEY,
  nome       text NOT NULL,
  cor        text DEFAULT '#6B7280' NOT NULL,
  tipo       text NOT NULL,
  parent_id  integer REFERENCES categories(id),
  user_id    integer NOT NULL REFERENCES users(id),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS cards (
  id                    serial PRIMARY KEY,
  nome                  text NOT NULL,
  tipo                  text NOT NULL,
  numero                text NOT NULL,
  cor                   text DEFAULT '#6B7280' NOT NULL,
  limite                numeric(12, 2) DEFAULT 0 NOT NULL,
  limite_disponivel     numeric(12, 2) DEFAULT 0 NOT NULL,
  dia_vencimento        integer DEFAULT 1 NOT NULL
                          CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  dias_fechamento_antes integer DEFAULT 10 NOT NULL,
  user_id               integer NOT NULL REFERENCES users(id),
  created_at            timestamp DEFAULT now() NOT NULL,
  updated_at            timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id               serial PRIMARY KEY,
  metodo_pagamento text NOT NULL,
  tipo             text NOT NULL,
  quantidade       numeric(12, 2) NOT NULL,
  fixo             boolean DEFAULT false NOT NULL,
  data             date NOT NULL,
  parcelas         integer,
  frequencia       text,
  user_id          integer NOT NULL REFERENCES users(id),
  card_id          integer REFERENCES cards(id),
  category_id      integer REFERENCES categories(id),
  observacoes      text,
  competencia_mes  integer,
  competencia_ano  integer,
  created_at       timestamp DEFAULT now() NOT NULL,
  updated_at       timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS incomes (
  id          serial PRIMARY KEY,
  tipo        text NOT NULL,
  quantidade  numeric(12, 2) NOT NULL,
  nota        text,
  data        date NOT NULL,
  fonte       text,
  fixo        boolean DEFAULT false NOT NULL,
  user_id     integer NOT NULL REFERENCES users(id),
  category_id integer REFERENCES categories(id),
  created_at  timestamp DEFAULT now() NOT NULL,
  updated_at  timestamp DEFAULT now() NOT NULL
);

-- Consultas do app: sempre por usuário e faixa de data.
CREATE INDEX IF NOT EXISTS expenses_user_data_idx ON expenses (user_id, data);
CREATE INDEX IF NOT EXISTS incomes_user_data_idx  ON incomes  (user_id, data);

-- ------------------------------------------------- 2. cartões, metas, planos --

CREATE TABLE IF NOT EXISTS card_invoices_payments (
  id              serial PRIMARY KEY,
  user_id         integer NOT NULL REFERENCES users(id),
  card_id         integer NOT NULL REFERENCES cards(id),
  competencia_mes integer NOT NULL,
  competencia_ano integer NOT NULL,
  amount_paid     numeric(12, 2) NOT NULL,
  created_at      timestamp DEFAULT now() NOT NULL,
  CONSTRAINT card_invoices_payments_user_card_competencia_key
    UNIQUE (user_id, card_id, competencia_mes, competencia_ano)
);

CREATE TABLE IF NOT EXISTS goals (
  id         serial PRIMARY KEY,
  user_id    integer NOT NULL REFERENCES users(id),
  nome       text NOT NULL,
  valor_alvo numeric(12, 2) NOT NULL,
  mes        integer NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano        integer NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT goals_user_mes_ano_key UNIQUE (user_id, mes, ano)
);

CREATE TABLE IF NOT EXISTS thresholds (
  id          serial PRIMARY KEY,
  user_id     integer NOT NULL REFERENCES users(id),
  category_id integer NOT NULL REFERENCES categories(id),
  valor       numeric(12, 2) NOT NULL,
  created_at  timestamp DEFAULT now() NOT NULL,
  updated_at  timestamp DEFAULT now() NOT NULL,
  CONSTRAINT thresholds_user_category_key UNIQUE (user_id, category_id)
);

CREATE TABLE IF NOT EXISTS plans (
  id                serial PRIMARY KEY,
  user_id           integer NOT NULL REFERENCES users(id),
  nome              text NOT NULL,
  descricao         text,
  meta              numeric(12, 2) NOT NULL,
  prazo             date NOT NULL,
  status            text DEFAULT 'Iniciando' NOT NULL,
  total_contribuido numeric(12, 2) DEFAULT 0 NOT NULL,
  -- Nulo = o cálculo de aporte usa a Selic ao vivo.
  taxa_anual        numeric(6, 4),
  created_at        timestamp DEFAULT now() NOT NULL,
  updated_at        timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS plan_contributions (
  id         serial PRIMARY KEY,
  plan_id    integer NOT NULL REFERENCES plans(id),
  user_id    integer NOT NULL REFERENCES users(id),
  valor      numeric(12, 2) NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS invite_codes (
  id         serial PRIMARY KEY,
  code       varchar NOT NULL UNIQUE,
  created_by integer NOT NULL REFERENCES users(id),
  is_used    boolean DEFAULT false NOT NULL,
  expires_at timestamp,
  used_by    integer REFERENCES users(id),
  used_at    timestamp,
  created_at timestamp DEFAULT now() NOT NULL
);

-- --------------------------------------------------- 3. assistente de IA ----

CREATE TABLE IF NOT EXISTS chat_messages (
  id         serial PRIMARY KEY,
  user_id    integer NOT NULL REFERENCES users(id),
  role       text NOT NULL,
  content    text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);

-- ----------------------------------------------------- 4. expense_history ----
-- Escrita por `server/utils/finance/saveExpenseHistory.ts`. Existe em produção
-- e no bootstrap dos testes, mas em nenhuma migration — por isso vem à parte.

CREATE TABLE IF NOT EXISTS expense_history (
  id            serial PRIMARY KEY,
  expense_id    integer REFERENCES expenses(id),
  user_id       integer NOT NULL REFERENCES users(id),
  tipo          text NOT NULL,
  alteracao     jsonb NOT NULL,
  data_alteracao timestamp DEFAULT now() NOT NULL
);

-- ------------------------------------------- 5. Open Finance (Pluggy) --------
-- Espelha `drizzle/0005_pluggy.sql`. As transações do banco entram nas próprias
-- `expenses`/`incomes` por estas colunas aditivas, então nenhum service muda.

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS pluggy_transaction_id text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS pluggy_account_id     text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS origem                text DEFAULT 'manual' NOT NULL;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS categoria_manual      boolean DEFAULT false NOT NULL;

ALTER TABLE incomes ADD COLUMN IF NOT EXISTS pluggy_transaction_id text;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS pluggy_account_id     text;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS origem                text DEFAULT 'manual' NOT NULL;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS categoria_manual      boolean DEFAULT false NOT NULL;

-- Único PARCIAL: a linha manual tem a coluna nula e não disputa o índice.
CREATE UNIQUE INDEX IF NOT EXISTS expenses_pluggy_tx_key
  ON expenses (pluggy_transaction_id) WHERE pluggy_transaction_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS incomes_pluggy_tx_key
  ON incomes (pluggy_transaction_id) WHERE pluggy_transaction_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS pluggy_items (
  id             serial PRIMARY KEY,
  user_id        integer NOT NULL REFERENCES users(id),
  item_id        text NOT NULL UNIQUE,
  connector_id   integer,
  connector_name text,
  status         text DEFAULT 'UPDATING' NOT NULL,
  last_synced_at timestamp,
  created_at     timestamp DEFAULT now() NOT NULL,
  updated_at     timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS pluggy_accounts (
  id         serial PRIMARY KEY,
  user_id    integer NOT NULL REFERENCES users(id),
  item_id    text NOT NULL REFERENCES pluggy_items(item_id),
  account_id text NOT NULL UNIQUE,
  type       text NOT NULL,
  subtype    text,
  nome       text,
  numero     text,
  saldo      numeric(12, 2),
  card_id    integer REFERENCES cards(id),
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL
);
