-- Mantém no app os dados de crédito já entregues pela Pluggy. As colunas são
-- aditivas para não alterar cartões cadastrados manualmente.
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "pluggy_account_id" text;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "instituicao" text;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "bandeira" text;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "fatura_atual" numeric(12, 2) DEFAULT '0' NOT NULL;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "fechamento_em" date;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "vencimento_em" date;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "sincronizado" boolean DEFAULT false NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "cards_pluggy_account_id_unique"
  ON "cards" ("pluggy_account_id");

CREATE INDEX IF NOT EXISTS "cards_user_id_idx" ON "cards" ("user_id");
