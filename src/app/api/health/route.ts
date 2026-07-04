import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import db from '@/server/db/drizzle'

// Endpoint público de saúde. Executa um SELECT real no Postgres para contar
// como atividade no Supabase (o free tier pausa projetos sem atividade) e
// serve de health-check para monitoramento/keep-alive via cron externo.
export async function GET() {
  try {
    await db.execute(sql`SELECT 1`)
    return NextResponse.json({
      success: true,
      status: 'ok',
      db: 'up',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { success: false, status: 'error', db: 'down' },
      { status: 503 }
    )
  }
}
