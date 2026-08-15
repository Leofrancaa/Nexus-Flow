import { sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'

export interface AssinaturasDoMesResult {
  total: number
  quantidade: number
}

export async function getAssinaturasDoMes(
  userId: string,
  mes: number,
  ano: number
): Promise<AssinaturasDoMesResult> {
  const result = await db.execute(sql`
    SELECT
      COALESCE(SUM(e.quantidade), 0) AS total,
      COUNT(*)::int AS quantidade
    FROM expenses e
    JOIN categories c ON c.id = e.category_id AND c.user_id = e.user_id
    WHERE e.user_id = ${userId}
      AND EXTRACT(MONTH FROM e.data) = ${mes}
      AND EXTRACT(YEAR FROM e.data) = ${ano}
      AND LOWER(TRANSLATE(c.nome, 'ÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ', 'AAAAEEEIIIOOOOUUUC')) LIKE '%assinatura%'
  `)
  const row = result.rows[0] as { total: string | number; quantidade: string | number }
  return {
    total: Number(row?.total ?? 0),
    quantidade: Number(row?.quantidade ?? 0),
  }
}
