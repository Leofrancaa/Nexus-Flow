-- Limpeza de escopo (bloco 4 do ROADMAP).
--
-- Sai o importador de extrato — a entrada de dados passa a ser a Pluggy, que
-- lê a transação direto do banco em vez de pedir um arquivo ao usuário — e
-- saem os três módulos não-financeiros (carreira, estudos, pessoal), que nunca
-- foram o assunto deste app.
--
-- `imported_transactions` antes de `import_batches`: a segunda é referenciada
-- pela primeira.

DROP TABLE IF EXISTS "imported_transactions";--> statement-breakpoint
DROP TABLE IF EXISTS "import_batches";--> statement-breakpoint
DROP TABLE IF EXISTS "career_milestones";--> statement-breakpoint
DROP TABLE IF EXISTS "career_profile";--> statement-breakpoint
DROP TABLE IF EXISTS "study_items";--> statement-breakpoint
DROP TABLE IF EXISTS "personal_goals";
