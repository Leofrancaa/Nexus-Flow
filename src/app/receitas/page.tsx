import { redirect } from "next/navigation";

/** Ver a nota em `app/despesas/page.tsx`. */
export default function ReceitasRedirect() {
  redirect("/atividades?tipo=entradas");
}
