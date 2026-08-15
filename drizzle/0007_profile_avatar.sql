DO $$
BEGIN
  -- O PGlite dos testes cria `profiles` depois das migrações históricas;
  -- produção já possui a tabela por vir do Supabase Auth.
  IF to_regclass('public.profiles') IS NOT NULL THEN
    ALTER TABLE "profiles"
    ADD COLUMN IF NOT EXISTS "avatar" text DEFAULT 'panther' NOT NULL;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'profiles_avatar_check'
        AND conrelid = 'public.profiles'::regclass
    ) THEN
      ALTER TABLE "profiles"
      ADD CONSTRAINT "profiles_avatar_check"
      CHECK ("avatar" IN ('panther', 'fox', 'panda', 'wolf', 'lion', 'owl', 'alien', 'robot'));
    END IF;
  END IF;
END
$$;
