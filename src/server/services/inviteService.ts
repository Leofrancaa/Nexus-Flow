import { eq, desc } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import db from '@/server/db/drizzle'
import { inviteCodes, profiles } from '@/server/db/schema'
import { createErrorResponse } from '@/server/utils/helper'

// Charset sem caracteres ambíguos (0/O, 1/I).
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateCode(len = 8): string {
  const bytes = randomBytes(len)
  let out = ''
  for (let i = 0; i < len; i++) out += CODE_CHARS[bytes[i] % CODE_CHARS.length]
  return out
}

export class InviteService {
  // Lista todos os códigos com info de quem usou (join em profiles).
  static async list() {
    return db
      .select({
        id: inviteCodes.id,
        code: inviteCodes.code,
        is_used: inviteCodes.is_used,
        expires_at: inviteCodes.expires_at,
        created_at: inviteCodes.created_at,
        used_at: inviteCodes.used_at,
        used_by_name: profiles.nome,
        used_by_email: profiles.email,
      })
      .from(inviteCodes)
      .leftJoin(profiles, eq(inviteCodes.used_by, profiles.id))
      .orderBy(desc(inviteCodes.created_at))
  }

  static async create(createdBy: string, expiresInDays?: number) {
    let code = generateCode()
    // Garante unicidade (colisão é raríssima, mas verifica algumas vezes).
    for (let i = 0; i < 5; i++) {
      const [exists] = await db
        .select({ id: inviteCodes.id })
        .from(inviteCodes)
        .where(eq(inviteCodes.code, code))
        .limit(1)
      if (!exists) break
      code = generateCode()
    }

    const expires_at =
      expiresInDays && expiresInDays > 0
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null

    const [row] = await db
      .insert(inviteCodes)
      .values({ code, created_by: createdBy, is_used: false, expires_at })
      .returning()

    return row
  }

  static async remove(id: number) {
    const result = await db
      .delete(inviteCodes)
      .where(eq(inviteCodes.id, id))
      .returning({ id: inviteCodes.id })

    if (result.length === 0) throw createErrorResponse('Código não encontrado.', 404)
    return { message: 'Código removido com sucesso.' }
  }

  static async listUsers() {
    return db
      .select({
        id: profiles.id,
        nome: profiles.nome,
        email: profiles.email,
        created_at: profiles.created_at,
        accepted_terms_at: profiles.accepted_terms_at,
      })
      .from(profiles)
      .orderBy(desc(profiles.created_at))
  }
}
