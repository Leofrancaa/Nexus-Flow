import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { sql } from 'drizzle-orm'
import { vi } from 'vitest'
import * as schema from '@/server/db/schema'

// Postgres efêmero em memória (WASM). Compartilhado por todos os testes.
const client = new PGlite()
export const db = drizzle(client, { schema })

// Substitui o client real do Drizzle pelo PGlite em todos os testes.
vi.mock('@/server/db/drizzle', () => ({
  default: db,
  schema,
}))

// Selic determinística nos testes (evita chamadas de rede ao BCB).
vi.mock('@/server/services/selicService', () => ({
  getSelicAnual: vi.fn(async () => ({ valor: 10, fonte: 'bcb' as const, atualizadoEm: 0 })),
}))

const TABLES = [
  'plan_contributions',
  'plans',
  'thresholds',
  'card_invoices_payments',
  'expenses',
  'incomes',
  'goals',
  'cards',
  'categories',
  'invite_codes',
  'expense_history',
  'chat_messages',
  'pluggy_accounts',
  'pluggy_items',
  'profiles',
  'users',
]

// Aplica todas as migrações geradas pelo drizzle-kit (em ordem) + tabela auxiliar expense_history.
export async function applySchema(): Promise<void> {
  const drizzleDir = path.join(process.cwd(), 'drizzle')
  const files = readdirSync(drizzleDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const ddl = readFileSync(path.join(drizzleDir, file), 'utf-8').replace(
      /-->\s*statement-breakpoint/g,
      ''
    )
    await client.exec(ddl)
  }

  await client.exec(`
    -- A produção usa auth.users + public.profiles com UUID. As migrações
    -- históricas do PGlite ainda usam ids inteiros; esta tabela mantém o
    -- contrato atual dos services sem tentar reproduzir o schema auth.
    CREATE TABLE IF NOT EXISTS profiles (
      id serial PRIMARY KEY,
      nome text NOT NULL,
      email text NOT NULL UNIQUE,
      avatar text DEFAULT 'panther' NOT NULL CHECK (avatar IN ('panther', 'fox', 'panda', 'wolf', 'lion', 'owl', 'alien', 'robot')),
      currency text DEFAULT 'BRL' NOT NULL,
      accepted_terms boolean DEFAULT false NOT NULL,
      accepted_terms_at timestamp,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expense_history (
      id serial PRIMARY KEY,
      expense_id integer NOT NULL,
      user_id integer NOT NULL,
      tipo text NOT NULL,
      alteracao jsonb,
      created_at timestamp DEFAULT now() NOT NULL
    );
  `)
}

// Limpa todas as tabelas e reinicia as sequences entre os testes.
export async function resetDb(): Promise<void> {
  await db.execute(sql.raw(`TRUNCATE ${TABLES.join(', ')} RESTART IDENTITY CASCADE;`))
}

export { schema, client }
