import { redirect } from "next/navigation";

/**
 * `/despesas` e `/receitas` viraram uma tela só: Atividades.
 *
 * A rota fica de pé porque é o que está nos favoritos e no atalho da PWA
 * instalada — some a tela, não o endereço.
 */
export default function DespesasRedirect() {
  redirect("/atividades?tipo=saidas");
}
