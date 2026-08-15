import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import db from '@/server/db/drizzle'
import { profiles } from '@/server/db/schema'
import { getAuthUser, unauthorizedResponse } from '@/server/lib/auth'
import { apiError, err, ok } from '@/server/lib/apiResponse'
import { isAvatarId } from '@/lib/avatars'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return unauthorizedResponse()

  return NextResponse.json({
    success: true,
    data: { user: { id: user.id, nome: user.nome, email: user.email, avatar: user.avatar } }
  })
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) return unauthorizedResponse()

    const body = (await request.json().catch(() => null)) as { avatar?: unknown } | null
    if (!isAvatarId(body?.avatar)) return err('Escolha um avatar válido.', 400)

    const [profile] = await db
      .update(profiles)
      .set({ avatar: body.avatar })
      .where(eq(profiles.id, user.id))
      .returning({ avatar: profiles.avatar })

    if (!profile) return err('Perfil não encontrado.', 404)
    return ok(profile, 'Avatar atualizado com sucesso.')
  } catch (error) {
    return apiError(error, 'Não foi possível atualizar o avatar.')
  }
}
