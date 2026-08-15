export interface Expense {
    id: number;
    tipo: string;
    quantidade: number;
    metodo_pagamento: string;
    data: string;
    fixo?: boolean;
    parcelas?: number;
    frequencia?: string;
    card_id?: number | null;
    category_id?: number | null;
    categoria_nome?: string;
    cor_categoria?: string;
    origem?: "manual" | "pluggy";
    conta_nome?: string;
    instituicao_nome?: string;
    instituicao_id?: number;
}
