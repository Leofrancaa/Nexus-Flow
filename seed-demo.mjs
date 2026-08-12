/**
 * TEMPORÁRIO — popula a conta com lançamentos de demonstração para o painel
 * ter o que desenhar. Apagar depois de usar.
 *
 * Tudo que ele cria carrega a marca DEMO_TAG em `observacoes` (despesas) ou
 * `nota` (receitas), então --limpar remove exatamente o que foi criado aqui e
 * nada mais.
 *
 *   DEMO_USER_ID=<uuid> node seed-demo.mjs
 *   DEMO_USER_ID=<uuid> node seed-demo.mjs --limpar
 */
import { readFileSync } from "node:fs";
import pg from "pg";

const USER_ID = process.env.DEMO_USER_ID;
const DEMO_TAG = "[demo-painel]";

if (!USER_ID) {
  console.error("Defina DEMO_USER_ID com o uuid do usuário.");
  process.exit(1);
}

// O .env.local não é carregado fora do Next; leio à mão só a chave que preciso.
function lerEnv(chave) {
  const bruto = readFileSync(new URL("./.env.local", import.meta.url), "utf8");
  for (const linha of bruto.split(/\r?\n/)) {
    const limpa = linha.trim();
    if (!limpa || limpa.startsWith("#")) continue;
    const igual = limpa.indexOf("=");
    if (igual === -1) continue;
    if (limpa.slice(0, igual).trim() !== chave) continue;
    return limpa
      .slice(igual + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return null;
}

const connectionString = lerEnv("DATABASE_URL");
if (!connectionString) {
  console.error("DATABASE_URL não encontrada em .env.local");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });

const CATEGORIAS = [
  { nome: "Alimentação", cor: "#d4ff00" },
  { nome: "Transporte", cor: "#38bdf8" },
  { nome: "Moradia", cor: "#fb923c" },
  { nome: "Lazer", cor: "#f472b6" },
  { nome: "Saúde", cor: "#a78bfa" },
];

// [dia do mês, categoria, descrição, valor]
const DESPESAS = [
  [2, "Alimentação", "Supermercado", 348.9],
  [3, "Transporte", "Combustível", 210.0],
  [4, "Alimentação", "Padaria", 42.3],
  [5, "Moradia", "Conta de luz", 187.55],
  [6, "Lazer", "Cinema", 68.0],
  [7, "Alimentação", "Delivery", 79.4],
  [8, "Transporte", "App de corrida", 34.9],
  [9, "Saúde", "Farmácia", 96.2],
  [10, "Alimentação", "Restaurante", 143.5],
  [11, "Moradia", "Internet", 129.9],
  [11, "Alimentação", "Feira", 88.7],
  [12, "Transporte", "Estacionamento", 25.0],
];

const RECEITAS = [
  [5, "Salário", 4200.0],
  [10, "Freelance", 850.0],
];

async function limpar() {
  const d = await pool.query(
    "DELETE FROM expenses WHERE user_id = $1 AND observacoes = $2",
    [USER_ID, DEMO_TAG]
  );
  const r = await pool.query(
    "DELETE FROM incomes WHERE user_id = $1 AND nota = $2",
    [USER_ID, DEMO_TAG]
  );
  console.log(`removidas ${d.rowCount} despesas e ${r.rowCount} receitas`);
}

async function criar() {
  const hoje = new Date();
  const mes = hoje.getMonth() + 1;
  const ano = hoje.getFullYear();
  const data = (dia) =>
    `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

  // Reaproveita a categoria se já existir, para não duplicar as do usuário.
  const idPorNome = new Map();
  for (const cat of CATEGORIAS) {
    const existente = await pool.query(
      "SELECT id FROM categories WHERE user_id = $1 AND nome = $2 AND tipo = 'despesa' LIMIT 1",
      [USER_ID, cat.nome]
    );
    if (existente.rows.length > 0) {
      idPorNome.set(cat.nome, existente.rows[0].id);
      continue;
    }
    const criada = await pool.query(
      "INSERT INTO categories (nome, cor, tipo, user_id) VALUES ($1, $2, 'despesa', $3) RETURNING id",
      [cat.nome, cat.cor, USER_ID]
    );
    idPorNome.set(cat.nome, criada.rows[0].id);
  }

  let despesas = 0;
  for (const [dia, categoria, descricao, valor] of DESPESAS) {
    if (dia > hoje.getDate()) continue; // não inventa gasto no futuro
    await pool.query(
      `INSERT INTO expenses
         (metodo_pagamento, tipo, quantidade, data, user_id, category_id, observacoes)
       VALUES ('debito', $1, $2, $3, $4, $5, $6)`,
      [descricao, valor, data(dia), USER_ID, idPorNome.get(categoria), DEMO_TAG]
    );
    despesas++;
  }

  let receitas = 0;
  for (const [dia, descricao, valor] of RECEITAS) {
    if (dia > hoje.getDate()) continue;
    await pool.query(
      `INSERT INTO incomes (tipo, quantidade, data, fonte, user_id, nota)
       VALUES ($1, $2, $3, 'Demonstração', $4, $5)`,
      [descricao, valor, data(dia), USER_ID, DEMO_TAG]
    );
    receitas++;
  }

  console.log(`criadas ${despesas} despesas e ${receitas} receitas`);
}

try {
  if (process.argv.includes("--limpar")) await limpar();
  else await criar();
} finally {
  await pool.end();
}
