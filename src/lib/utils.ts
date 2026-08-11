import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Junta classes resolvendo conflitos do Tailwind — a última vence.
 * Sem o twMerge, passar className num componente não sobrescrevia o estilo
 * base de forma previsível: quem ganhava era a ordem da folha gerada.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Formata uma data string (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
 * Evita problemas de timezone ao não converter para Date object
 */
export function formatDateBR(dateString: string): string {
    if (!dateString) return ''

    // Pegar apenas a parte da data (YYYY-MM-DD)
    const datePart = dateString.split('T')[0].split(' ')[0]
    const [year, month, day] = datePart.split('-')

    return `${day}/${month}/${year}`
}
