import { sql } from 'drizzle-orm'
import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  boolean,
  numeric,
  timestamp,
  date,
  uuid,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// Colunas que a sincronização da Pluggy acrescenta a `expenses` e `incomes`.
// São aditivas e nullable de propósito: a linha lançada à mão continua com
// `origem = 'manual'` e os ids nulos, e nenhum service precisou mudar.
const pluggyColumns = {
  pluggy_transaction_id: text('pluggy_transaction_id'),
  pluggy_account_id: text('pluggy_account_id'),
  // 'manual' | 'pluggy'
  origem: text('origem').default('manual').notNull(),
  // Marca que o usuário escolheu a categoria — o re-sync não sobrescreve.
  categoria_manual: boolean('categoria_manual').default(false).notNull(),
}

// Timestamps reutilizados (created_at / updated_at) — mantêm o comportamento do Prisma
// (retornam objetos Date e atualizam updated_at automaticamente).
const timestamps = {
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
}

export const profiles = pgTable('profiles', {
  // Este é o UUID emitido por auth.users. Não há senha ou token local.
  id: uuid('id').primaryKey(),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  currency: text('currency').default('BRL').notNull(),
  accepted_terms: boolean('accepted_terms').default(false).notNull(),
  accepted_terms_at: timestamp('accepted_terms_at', { mode: 'date' }),
  ...timestamps,
})

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  cor: text('cor').default('#6B7280').notNull(),
  tipo: text('tipo').notNull(),
  parent_id: integer('parent_id'),
  user_id: uuid('user_id').notNull(),
  ...timestamps,
})

export const expenses = pgTable(
  'expenses',
  {
    id: serial('id').primaryKey(),
    metodo_pagamento: text('metodo_pagamento').notNull(),
    tipo: text('tipo').notNull(),
    quantidade: numeric('quantidade', { precision: 12, scale: 2 }).notNull(),
    fixo: boolean('fixo').default(false).notNull(),
    data: date('data', { mode: 'date' }).notNull(),
    parcelas: integer('parcelas'),
    frequencia: text('frequencia'),
    user_id: uuid('user_id').notNull(),
    card_id: integer('card_id'),
    category_id: integer('category_id'),
    observacoes: text('observacoes'),
    competencia_mes: integer('competencia_mes'),
    competencia_ano: integer('competencia_ano'),
    ...pluggyColumns,
    ...timestamps,
  },
  (t) => [
    // Parcial: as linhas manuais têm a coluna nula e não disputam o índice.
    uniqueIndex('expenses_pluggy_tx_key')
      .on(t.pluggy_transaction_id)
      .where(sql`${t.pluggy_transaction_id} IS NOT NULL`),
  ]
)

export const incomes = pgTable(
  'incomes',
  {
    id: serial('id').primaryKey(),
    tipo: text('tipo').notNull(),
    quantidade: numeric('quantidade', { precision: 12, scale: 2 }).notNull(),
    nota: text('nota'),
    data: date('data', { mode: 'date' }).notNull(),
    fonte: text('fonte'),
    fixo: boolean('fixo').default(false).notNull(),
    user_id: uuid('user_id').notNull(),
    category_id: integer('category_id'),
    ...pluggyColumns,
    ...timestamps,
  },
  (t) => [
    uniqueIndex('incomes_pluggy_tx_key')
      .on(t.pluggy_transaction_id)
      .where(sql`${t.pluggy_transaction_id} IS NOT NULL`),
  ]
)

export const cards = pgTable('cards', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  tipo: text('tipo').notNull(),
  numero: text('numero').notNull(),
  cor: text('cor').default('#6B7280').notNull(),
  limite: numeric('limite', { precision: 12, scale: 2 }).default('0').notNull(),
  limite_disponivel: numeric('limite_disponivel', { precision: 12, scale: 2 })
    .default('0')
    .notNull(),
  dia_vencimento: integer('dia_vencimento').default(1).notNull(),
  dias_fechamento_antes: integer('dias_fechamento_antes').default(10).notNull(),
  user_id: uuid('user_id').notNull(),
  ...timestamps,
})

export const cardInvoicesPayments = pgTable(
  'card_invoices_payments',
  {
    id: serial('id').primaryKey(),
    user_id: uuid('user_id').notNull(),
    card_id: integer('card_id').notNull(),
    competencia_mes: integer('competencia_mes').notNull(),
    competencia_ano: integer('competencia_ano').notNull(),
    amount_paid: numeric('amount_paid', { precision: 12, scale: 2 }).notNull(),
    created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    unique('card_invoices_payments_user_card_competencia_key').on(
      t.user_id,
      t.card_id,
      t.competencia_mes,
      t.competencia_ano
    ),
  ]
)

export const goals = pgTable(
  'goals',
  {
    id: serial('id').primaryKey(),
    user_id: uuid('user_id').notNull(),
    nome: text('nome').notNull(),
    valor_alvo: numeric('valor_alvo', { precision: 12, scale: 2 }).notNull(),
    mes: integer('mes').notNull(),
    ano: integer('ano').notNull(),
    ...timestamps,
  },
  (t) => [unique('goals_user_mes_ano_key').on(t.user_id, t.mes, t.ano)]
)

export const plans = pgTable('plans', {
  id: serial('id').primaryKey(),
  user_id: uuid('user_id').notNull(),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  meta: numeric('meta', { precision: 12, scale: 2 }).notNull(),
  prazo: date('prazo', { mode: 'date' }).notNull(),
  status: text('status').default('Iniciando').notNull(),
  total_contribuido: numeric('total_contribuido', { precision: 12, scale: 2 })
    .default('0')
    .notNull(),
  // Coluna nova (aditiva, nullable): taxa anual personalizada em % a.a.
  // Quando null, o cálculo de aporte usa a Selic ao vivo.
  taxa_anual: numeric('taxa_anual', { precision: 6, scale: 4 }),
  ...timestamps,
})

export const planContributions = pgTable('plan_contributions', {
  id: serial('id').primaryKey(),
  plan_id: integer('plan_id').notNull(),
  user_id: uuid('user_id').notNull(),
  valor: numeric('valor', { precision: 12, scale: 2 }).notNull(),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

export const thresholds = pgTable(
  'thresholds',
  {
    id: serial('id').primaryKey(),
    user_id: uuid('user_id').notNull(),
    category_id: integer('category_id').notNull(),
    valor: numeric('valor', { precision: 12, scale: 2 }).notNull(),
    ...timestamps,
  },
  (t) => [unique('thresholds_user_category_key').on(t.user_id, t.category_id)]
)

// ===== AI assistant chat (Qwen) =====
// Histórico de mensagens; também usado para contar o limite diário por usuário.
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  user_id: uuid('user_id').notNull(),
  // 'user' | 'assistant'
  role: text('role').notNull(),
  content: text('content').notNull(),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

// ===== Open Finance (Pluggy) =====

// Uma conexão com uma instituição. `item_id` é o id do lado da Pluggy e é por
// ele que o webhook encontra o dono do evento.
export const pluggyItems = pgTable('pluggy_items', {
  id: serial('id').primaryKey(),
  user_id: uuid('user_id').notNull(),
  item_id: text('item_id').notNull().unique(),
  connector_id: integer('connector_id'),
  connector_name: text('connector_name'),
  // 'UPDATING' | 'UPDATED' | 'LOGIN_ERROR' | 'OUTDATED' | 'WAITING_USER_INPUT'
  status: text('status').default('UPDATING').notNull(),
  last_synced_at: timestamp('last_synced_at', { mode: 'date' }),
  ...timestamps,
})

// Conta dentro de um item: corrente, poupança ou cartão. `card_id` amarra a
// conta de crédito ao cartão já cadastrado no app — enquanto for nulo, a fatura
// que veio do banco não tem onde aparecer.
export const pluggyAccounts = pgTable('pluggy_accounts', {
  id: serial('id').primaryKey(),
  user_id: uuid('user_id').notNull(),
  item_id: text('item_id').notNull(),
  account_id: text('account_id').notNull().unique(),
  // 'BANK' | 'CREDIT'
  type: text('type').notNull(),
  subtype: text('subtype'),
  nome: text('nome'),
  numero: text('numero'),
  saldo: numeric('saldo', { precision: 12, scale: 2 }),
  card_id: integer('card_id'),
  ...timestamps,
})

// Caixa de entrada idempotente dos webhooks. A Pluggy repete entregas quando
// não recebe 2xx; o event_id único impede processar a mesma mudança duas vezes.
export const pluggyWebhookEvents = pgTable('pluggy_webhook_events', {
  id: serial('id').primaryKey(),
  event_id: text('event_id').notNull().unique(),
  event: text('event').notNull(),
  item_id: text('item_id'),
  status: text('status').default('received').notNull(),
  error: text('error'),
  processed_at: timestamp('processed_at', { mode: 'date' }),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})

export const inviteCodes = pgTable('invite_codes', {
  id: serial('id').primaryKey(),
  code: varchar('code').notNull().unique(),
  created_by: uuid('created_by').notNull(),
  is_used: boolean('is_used').default(false).notNull(),
  expires_at: timestamp('expires_at', { mode: 'date' }),
  used_by: uuid('used_by'),
  used_at: timestamp('used_at', { mode: 'date' }),
  created_at: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
})
