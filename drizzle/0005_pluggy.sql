-- Open Finance (Pluggy) — bloco 5 do ROADMAP.
--
-- As transações sincronizadas entram nas próprias tabelas `expenses` e
-- `incomes`, por colunas aditivas. Assim dashboard, gráficos, limites, metas,
-- carryover e o contexto do assistente passam a enxergar dados bancários sem
-- que nenhum service precise mudar.
--
-- Lembrete do ROADMAP: `npm run db:push` faz diff do `schema.ts` contra o banco
-- e NÃO executa este arquivo. Ele existe para o `mocks/db.ts` replicar o mesmo
-- schema no PGlite. Toda mudança vai nos dois lugares.

ALTER TABLE "expenses" ADD COLUMN "pluggy_transaction_id" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "pluggy_account_id" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "origem" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "categoria_manual" boolean DEFAULT false NOT NULL;--> statement-breakpoint

ALTER TABLE "incomes" ADD COLUMN "pluggy_transaction_id" text;--> statement-breakpoint
ALTER TABLE "incomes" ADD COLUMN "pluggy_account_id" text;--> statement-breakpoint
ALTER TABLE "incomes" ADD COLUMN "origem" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "incomes" ADD COLUMN "categoria_manual" boolean DEFAULT false NOT NULL;--> statement-breakpoint

-- Único PARCIAL: lançamento manual tem a coluna nula e não colide com nada.
CREATE UNIQUE INDEX "expenses_pluggy_tx_key" ON "expenses" ("pluggy_transaction_id")
  WHERE "pluggy_transaction_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "incomes_pluggy_tx_key" ON "incomes" ("pluggy_transaction_id")
  WHERE "pluggy_transaction_id" IS NOT NULL;--> statement-breakpoint

-- Uma conexão com uma instituição. `item_id` é o id do lado da Pluggy.
CREATE TABLE "pluggy_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"item_id" text NOT NULL,
	"connector_id" integer,
	"connector_name" text,
	"status" text DEFAULT 'UPDATING' NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pluggy_items_item_id_unique" UNIQUE("item_id")
);--> statement-breakpoint

-- Conta dentro de um item: corrente, poupança ou cartão.
-- `card_id` liga a conta de crédito ao cartão já cadastrado no app; enquanto for
-- nulo, a fatura da Pluggy não tem onde aparecer.
CREATE TABLE "pluggy_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"item_id" text NOT NULL,
	"account_id" text NOT NULL,
	"type" text NOT NULL,
	"subtype" text,
	"nome" text,
	"numero" text,
	"saldo" numeric(12, 2),
	"card_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pluggy_accounts_account_id_unique" UNIQUE("account_id")
);
