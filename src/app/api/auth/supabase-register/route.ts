import { createServerClient } from '@supabase/ssr'
import { and, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import db from '@/server/db/drizzle'
import { inviteCodes, profiles } from '@/server/db/schema'

export async function POST(request: NextRequest) {
  try {
    const { nome, email, senha, inviteCode, aceitouTermos } = await request.json()
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const normalizedInviteCode = typeof inviteCode === 'string' ? inviteCode.trim().toUpperCase() : ''

    if (!nome || !normalizedEmail || !senha || !aceitouTermos) {
      return NextResponse.json({ success: false, error: 'Preencha todos os dados e aceite os termos para continuar.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || senha.length < 6) {
      return NextResponse.json({ success: false, error: 'Informe um e-mail válido e uma senha de ao menos 6 caracteres.' }, { status: 400 })
    }

    const [profileCount, inviteCount] = await Promise.all([
      db.$count(profiles),
      db.$count(inviteCodes),
    ])
    const isBootstrap = profileCount === 0

    if (!isBootstrap) {
      if (!normalizedInviteCode) {
        return NextResponse.json({ success: false, error: 'Código de convite é obrigatório.' }, { status: 400 })
      }
      const [invite] = await db
        .select({ id: inviteCodes.id, expires_at: inviteCodes.expires_at })
        .from(inviteCodes)
        .where(and(eq(inviteCodes.code, normalizedInviteCode), eq(inviteCodes.is_used, false)))
        .limit(1)
      if (!invite || (invite.expires_at && invite.expires_at < new Date())) {
        return NextResponse.json({ success: false, error: 'Código de convite inválido ou expirado.' }, { status: 400 })
      }
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!url || !publishableKey) throw new Error('Supabase Auth não está configurado.')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const response = NextResponse.json(
      {
        success: true,
        message: 'Conta criada. Confirme seu e-mail para acessar o Nexus.',
        bootstrap: isBootstrap && inviteCount === 0,
      },
      { status: 201 }
    )
    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    })
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: senha,
      options: {
        emailRedirectTo: new URL('/auth/callback?next=/dashboard', appUrl).toString(),
        data: { nome: nome.trim(), accepted_terms: true },
      },
    })
    if (error || !data.user) {
      return NextResponse.json({ success: false, error: error?.message || 'Não foi possível criar a conta.' }, { status: 400 })
    }

    if (!isBootstrap && normalizedInviteCode) {
      await db
        .update(inviteCodes)
        .set({ is_used: true, used_by: data.user.id, used_at: new Date() })
        .where(and(eq(inviteCodes.code, normalizedInviteCode), eq(inviteCodes.is_used, false)))
    }

    return response
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Erro ao criar conta.' }, { status: 500 })
  }
}
