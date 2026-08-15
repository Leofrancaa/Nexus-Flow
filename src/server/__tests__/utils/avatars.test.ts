import { describe, expect, it } from 'vitest'
import { DEFAULT_AVATAR, getAvatar, isAvatarId } from '@/lib/avatars'

describe('avatars', () => {
  it('aceita somente avatares disponíveis', () => {
    expect(isAvatarId('fox')).toBe(true)
    expect(isAvatarId('qualquer-coisa')).toBe(false)
    expect(isAvatarId(null)).toBe(false)
  })

  it('usa um avatar seguro quando o valor salvo não existe', () => {
    expect(getAvatar('removido').id).toBe(DEFAULT_AVATAR)
  })
})
