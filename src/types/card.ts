export interface CardType {
    id: number;
    nome: string;
    numero: string;
    tipo: string;
    cor: string;
    limite: number;
    limite_disponivel: number;
    dia_vencimento: number;
    gasto_total: number;
    proximo_vencimento: string;
    fatura_atual?: number;
    instituicao?: string | null;
    bandeira?: string | null;
    sincronizado?: boolean;
    fechamento_em?: string | null;
    vencimento_em?: string | null;
}
