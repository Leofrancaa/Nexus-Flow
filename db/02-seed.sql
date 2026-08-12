-- =============================================================================
-- Nexus Flow — dados de exemplo para testar o app.
--
-- Rode DEPOIS do `01-schema.sql`, no mesmo SQL Editor. Só para banco local/de
-- teste: cria um usuário com senha conhecida.
--
--   e-mail: teste@nexus.dev
--   senha:  nexus123
--
-- As datas são relativas a `CURRENT_DATE`, então o mês corrente sempre tem
-- movimento — não importa quando você rodar. Rodar duas vezes duplica os
-- lançamentos; para recomeçar do zero, use o bloco comentado no fim.
-- =============================================================================

-- ------------------------------------------------------------------ usuário --

INSERT INTO users (nome, email, senha, currency, accepted_terms, accepted_terms_at, email_verified)
VALUES (
  'Leonardo Franca',
  'teste@nexus.dev',
  -- bcrypt de 'nexus123'
  '$2b$10$kDZIxLiPMdYj5lW.WPUxq.h093uIvshU/VG5Dqu93L1n.0z38KMei',
  'BRL', true, now(), true
)
ON CONFLICT (email) DO NOTHING;

-- Convite sobrando, para a tela de cadastro também funcionar.
INSERT INTO invite_codes (code, created_by, expires_at)
SELECT 'NEXUS-TESTE', u.id, now() + interval '1 year'
FROM users u WHERE u.email = 'teste@nexus.dev'
ON CONFLICT (code) DO NOTHING;

-- --------------------------------------------------------------- categorias --

INSERT INTO categories (nome, cor, tipo, user_id)
SELECT c.nome, c.cor, c.tipo, u.id
FROM users u,
  (VALUES
    ('Alimentação',  '#d4ff00', 'despesa'),
    ('Moradia',      '#38bdf8', 'despesa'),
    ('Transporte',   '#fb923c', 'despesa'),
    ('Lazer',        '#f472b6', 'despesa'),
    ('Saúde',        '#a78bfa', 'despesa'),
    ('Assinaturas',  '#2dd4bf', 'despesa'),
    ('Salário',      '#a3e635', 'receita'),
    ('Freelance',    '#38bdf8', 'receita'),
    ('Rendimentos',  '#fbbf24', 'receita')
  ) AS c(nome, cor, tipo)
WHERE u.email = 'teste@nexus.dev';

-- ------------------------------------------------------------------- cartão --

INSERT INTO cards (nome, tipo, numero, cor, limite, limite_disponivel,
                   dia_vencimento, dias_fechamento_antes, user_id)
SELECT 'Nubank', 'credito', '4111', '#a78bfa', 5000.00, 3742.10, 10, 7, u.id
FROM users u WHERE u.email = 'teste@nexus.dev';

-- ----------------------------------------------------------------- despesas --
-- `data` é calculada a partir do primeiro dia do mês corrente, então o mês
-- sempre tem o que mostrar.

INSERT INTO expenses (tipo, quantidade, metodo_pagamento, data, fixo, user_id,
                      category_id, card_id, competencia_mes, competencia_ano, observacoes)
SELECT
  d.descricao,
  d.valor,
  d.metodo,
  date_trunc('month', CURRENT_DATE)::date + (d.dia - 1),
  d.fixo,
  u.id,
  cat.id,
  CASE WHEN d.metodo = 'cartao de credito' THEN card.id END,
  CASE WHEN d.metodo = 'cartao de credito'
       THEN EXTRACT(MONTH FROM date_trunc('month', CURRENT_DATE))::int END,
  CASE WHEN d.metodo = 'cartao de credito'
       THEN EXTRACT(YEAR FROM date_trunc('month', CURRENT_DATE))::int END,
  d.obs
FROM users u
JOIN cards card ON card.user_id = u.id
JOIN (VALUES
  -- dia, descrição,                valor,   método,               categoria,      fixo,  obs
  ( 1, 'Aluguel',                  1850.00, 'pix',                'Moradia',      true,  NULL),
  ( 1, 'Internet fibra',            129.90, 'debito',             'Moradia',      true,  NULL),
  ( 2, 'Mercado do mês',            642.35, 'cartao de credito',  'Alimentação',  false, 'Compra grande'),
  ( 2, 'Spotify',                    21.90, 'cartao de credito',  'Assinaturas',  true,  NULL),
  ( 3, 'Uber para o trabalho',       28.40, 'cartao de credito',  'Transporte',   false, NULL),
  ( 3, 'Padaria',                    18.50, 'dinheiro',           'Alimentação',  false, NULL),
  ( 4, 'Academia',                  109.00, 'debito',             'Saúde',        true,  NULL),
  ( 5, 'Conta de luz',              187.62, 'pix',                'Moradia',      true,  NULL),
  ( 5, 'Almoço no centro',           42.00, 'cartao de credito',  'Alimentação',  false, NULL),
  ( 6, 'Netflix',                    39.90, 'cartao de credito',  'Assinaturas',  true,  NULL),
  ( 6, 'Gasolina',                  210.00, 'cartao de credito',  'Transporte',   false, NULL),
  ( 7, 'Cinema',                     68.00, 'cartao de credito',  'Lazer',        false, 'Sessão dupla'),
  ( 7, 'Farmácia',                   93.20, 'debito',             'Saúde',        false, NULL),
  ( 8, 'Feira',                      86.70, 'dinheiro',           'Alimentação',  false, NULL),
  ( 9, 'Jantar fora',               164.00, 'cartao de credito',  'Lazer',        false, NULL),
  ( 9, 'Uber de volta',              31.80, 'cartao de credito',  'Transporte',   false, NULL),
  (10, 'Conta de água',              78.40, 'pix',                'Moradia',      true,  NULL),
  (10, 'Café',                       14.00, 'dinheiro',           'Alimentação',  false, NULL),
  (11, 'Mercado da semana',         198.55, 'cartao de credito',  'Alimentação',  false, NULL),
  (11, 'Consulta dentista',         280.00, 'pix',                'Saúde',        false, 'Retorno em 6 meses'),
  (12, 'Assinatura iCloud',          10.90, 'cartao de credito',  'Assinaturas',  true,  NULL),
  (14, 'Show',                      240.00, 'cartao de credito',  'Lazer',        false, NULL),
  (15, 'Passagem de ônibus',         96.00, 'debito',             'Transporte',   false, NULL),
  (18, 'Mercado da semana',         173.20, 'cartao de credito',  'Alimentação',  false, NULL),
  (20, 'Presente de aniversário',   150.00, 'pix',                'Lazer',        false, NULL)
) AS d(dia, descricao, valor, metodo, categoria, fixo, obs) ON true
JOIN categories cat ON cat.user_id = u.id AND cat.nome = d.categoria AND cat.tipo = 'despesa'
WHERE u.email = 'teste@nexus.dev'
  -- Nada lançado no futuro: o mês corrente só vai até hoje.
  AND date_trunc('month', CURRENT_DATE)::date + (d.dia - 1) <= CURRENT_DATE;

-- Dois meses anteriores, para o gráfico de balanço ter linha e não um ponto.
INSERT INTO expenses (tipo, quantidade, metodo_pagamento, data, fixo, user_id, category_id)
SELECT
  d.descricao,
  d.valor,
  'pix',
  (date_trunc('month', CURRENT_DATE) - (d.meses_atras || ' month')::interval)::date + (d.dia - 1),
  d.fixo,
  u.id,
  cat.id
FROM users u
JOIN (VALUES
  (1,  1, 'Aluguel',           1850.00, 'Moradia',     true),
  (1,  4, 'Mercado do mês',     712.90, 'Alimentação', false),
  (1,  8, 'Gasolina',           245.00, 'Transporte',  false),
  (1, 12, 'Conta de luz',       203.15, 'Moradia',     true),
  (1, 16, 'Restaurante',        188.00, 'Lazer',       false),
  (1, 22, 'Farmácia',           124.60, 'Saúde',       false),
  (2,  1, 'Aluguel',           1850.00, 'Moradia',     true),
  (2,  5, 'Mercado do mês',     668.40, 'Alimentação', false),
  (2, 11, 'Gasolina',           198.00, 'Transporte',  false),
  (2, 15, 'Conta de luz',       176.80, 'Moradia',     true),
  (2, 19, 'Cinema',              72.00, 'Lazer',       false)
) AS d(meses_atras, dia, descricao, valor, categoria, fixo) ON true
JOIN categories cat ON cat.user_id = u.id AND cat.nome = d.categoria AND cat.tipo = 'despesa'
WHERE u.email = 'teste@nexus.dev';

-- ----------------------------------------------------------------- receitas --

INSERT INTO incomes (tipo, quantidade, fonte, data, fixo, user_id, category_id, nota)
SELECT
  r.descricao,
  r.valor,
  r.fonte,
  (date_trunc('month', CURRENT_DATE) - (r.meses_atras || ' month')::interval)::date + (r.dia - 1),
  r.fixo,
  u.id,
  cat.id,
  r.nota
FROM users u
JOIN (VALUES
  (0,  5, 'Salário',              7200.00, 'Empresa',        'Salário',     true,  NULL),
  (0,  9, 'Projeto freelance',    1450.00, 'Cliente',        'Freelance',   false, 'Landing page'),
  (0, 11, 'Rendimento CDB',         86.40, 'Banco',          'Rendimentos', false, NULL),
  (1,  5, 'Salário',              7200.00, 'Empresa',        'Salário',     true,  NULL),
  (1, 14, 'Projeto freelance',     900.00, 'Cliente',        'Freelance',   false, NULL),
  (1, 28, 'Rendimento CDB',         81.20, 'Banco',          'Rendimentos', false, NULL),
  (2,  5, 'Salário',              7200.00, 'Empresa',        'Salário',     true,  NULL),
  (2, 27, 'Rendimento CDB',         79.90, 'Banco',          'Rendimentos', false, NULL)
) AS r(meses_atras, dia, descricao, valor, fonte, categoria, fixo, nota) ON true
JOIN categories cat ON cat.user_id = u.id AND cat.nome = r.categoria AND cat.tipo = 'receita'
WHERE u.email = 'teste@nexus.dev'
  AND (date_trunc('month', CURRENT_DATE) - (r.meses_atras || ' month')::interval)::date
      + (r.dia - 1) <= CURRENT_DATE;

-- ------------------------------------------------- limites, metas e planos ---

-- Alimentação de propósito perto do teto, para o alerta de limite aparecer.
INSERT INTO thresholds (user_id, category_id, valor)
SELECT u.id, cat.id, t.valor
FROM users u
JOIN (VALUES ('Alimentação', 1000.00), ('Lazer', 500.00), ('Transporte', 400.00))
  AS t(categoria, valor) ON true
JOIN categories cat ON cat.user_id = u.id AND cat.nome = t.categoria AND cat.tipo = 'despesa'
WHERE u.email = 'teste@nexus.dev'
ON CONFLICT (user_id, category_id) DO NOTHING;

INSERT INTO goals (user_id, nome, valor_alvo, mes, ano)
SELECT u.id, 'Economizar no mês', 2000.00,
       EXTRACT(MONTH FROM CURRENT_DATE)::int,
       EXTRACT(YEAR  FROM CURRENT_DATE)::int
FROM users u WHERE u.email = 'teste@nexus.dev'
ON CONFLICT (user_id, mes, ano) DO NOTHING;

INSERT INTO plans (user_id, nome, descricao, meta, prazo, status, total_contribuido, taxa_anual)
SELECT u.id, p.nome, p.descricao, p.meta,
       (CURRENT_DATE + (p.meses_ate || ' month')::interval)::date,
       p.status, p.contribuido, p.taxa
FROM users u
JOIN (VALUES
  ('Reserva de emergência', 'Seis meses de custo fixo', 30000.00, 18, 'Em andamento',  8400.00, NULL),
  ('Troca de notebook',     'Máquina nova para trabalho', 9000.00,  8, 'Iniciando',    1200.00, 12.5000)
) AS p(nome, descricao, meta, meses_ate, status, contribuido, taxa) ON true
WHERE u.email = 'teste@nexus.dev';

INSERT INTO plan_contributions (plan_id, user_id, valor, created_at)
SELECT pl.id, u.id, c.valor,
       (CURRENT_DATE - (c.meses_atras || ' month')::interval)
FROM users u
JOIN plans pl ON pl.user_id = u.id AND pl.nome = 'Reserva de emergência'
JOIN (VALUES (3, 2800.00), (2, 2800.00), (1, 2800.00)) AS c(meses_atras, valor) ON true
WHERE u.email = 'teste@nexus.dev';

-- =============================================================================
-- Para recomeçar do zero (apaga TUDO do usuário de teste e reinicia os ids):
--
-- TRUNCATE plan_contributions, plans, thresholds, card_invoices_payments,
--          expenses, incomes, goals, cards, categories, invite_codes,
--          expense_history, chat_messages, pluggy_accounts, pluggy_items, users
--   RESTART IDENTITY CASCADE;
-- =============================================================================
