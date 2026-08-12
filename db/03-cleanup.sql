-- =============================================================================
-- Nexus Flow — remove as tabelas dos módulos que saíram do escopo.
--
-- Rode este arquivo se você já executou uma versão anterior do `01-schema.sql`,
-- que ainda criava as tabelas de importação de extrato, carreira, estudos e
-- pessoal. O `01-schema.sql` de hoje não as cria mais.
--
-- É o mesmo conteúdo de `drizzle/0006_remove_import_and_personal.sql`, com um
-- relatório no fim para você conferir o resultado.
--
-- ⚠️ Isto APAGA dados. Num banco recém-criado pelo seed elas estão vazias, mas
--    se você já usou essas telas em produção, exporte antes.
-- =============================================================================

-- `imported_transactions` primeiro: ela referencia `import_batches`.
DROP TABLE IF EXISTS imported_transactions;
DROP TABLE IF EXISTS import_batches;

DROP TABLE IF EXISTS career_milestones;
DROP TABLE IF EXISTS career_profile;
DROP TABLE IF EXISTS study_items;
DROP TABLE IF EXISTS personal_goals;

-- Estava no dump de produção, mas nenhuma linha do código a referencia.
DROP TABLE IF EXISTS recurring_expenses;

-- ------------------------------------------------------------- conferência --
-- Devem sobrar exatamente estas 15 tabelas:
--   card_invoices_payments, cards, categories, chat_messages, expense_history,
--   expenses, goals, incomes, invite_codes, plan_contributions, plans,
--   pluggy_accounts, pluggy_items, thresholds, users

SELECT
  count(*) AS tabelas_restantes,
  string_agg(tablename, ', ' ORDER BY tablename) AS lista
FROM pg_tables
WHERE schemaname = 'public';
