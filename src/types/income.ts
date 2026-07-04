export interface Income {
    id: number;
    tipo: string;
    quantidade: number;
    data: string;
    fonte: string;
    fixo?: boolean; // ✅ novo campo
    nota?: string; // campo persistido no banco
    /** @deprecated o banco usa "nota"; mantido só por compatibilidade */
    observacoes?: string;
    category_id?: number;
    categoria_nome?: string;
    cor_categoria?: string;
}
