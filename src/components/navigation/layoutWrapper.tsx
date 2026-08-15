"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottomNav";
import { Fab } from "@/components/layout/fab";
import { Toaster } from "react-hot-toast";
import { Check, LoaderCircle, TriangleAlert } from "lucide-react";

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

/**
 * Telas em que o FAB atrapalharia mais do que ajudaria: o assistente já tem
 * um campo fixo no rodapé, e o perfil é hub de navegação, não de lançamento.
 */
const routesWithoutFab = ["/assistente", "/perfil", "/open-finance", "/categorias/gastos"];

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublic = publicRoutes.includes(pathname);
  const showFab = !routesWithoutFab.some((r) => pathname.startsWith(r));

  return (
    <>
      {!isPublic ? (
        <>
          {/* `pb-nav` garante que nenhuma tela termine escondida atrás da
              barra — inclusive as que ainda não foram migradas. É `div` porque
              o `<main>` é responsabilidade da página. */}
          <div className="min-h-dvh pb-nav">{children}</div>
          {showFab && <Fab />}
          <BottomNav />
        </>
      ) : (
        <>{children}</>
      )}

      <Toaster
        position="top-center"
        containerStyle={{
          top: 20,
        }}
        toastOptions={{
          duration: 4000,
          className: "nx-toast",
          style: {
            background: "linear-gradient(145deg, #1A1D21 0%, #111316 100%)",
            color: "#F5F7F8",
            border: "1px solid rgba(255,255,255,.08)",
            borderRadius: "16px",
            padding: "12px 14px",
            fontFamily: "var(--font-manrope), sans-serif",
            fontSize: "14px",
            fontWeight: "600",
            maxWidth: "min(400px, calc(100vw - 32px))",
            wordBreak: "break-word",
            boxShadow: "0 22px 54px rgba(0,0,0,.5)",
          },
          success: {
            duration: 3000,
            className: "nx-toast nx-toast-success",
            icon: <Check className="h-4 w-4 text-brand" />,
            style: {
              border: "1px solid rgba(212,255,0,.22)",
              boxShadow: "0 22px 54px rgba(0,0,0,.5), 0 0 24px rgba(212,255,0,.06)",
            },
          },
          error: {
            duration: 5000,
            className: "nx-toast nx-toast-error",
            icon: <TriangleAlert className="h-4 w-4 text-negative" />,
            style: {
              border: "1px solid rgba(242,100,112,.24)",
              boxShadow: "0 22px 54px rgba(0,0,0,.5), 0 0 24px rgba(242,100,112,.06)",
            },
          },
          loading: {
            duration: Infinity,
            className: "nx-toast nx-toast-loading",
            icon: <LoaderCircle className="h-4 w-4 animate-spin text-brand" />,
            style: {
              border: "1px solid rgba(212,255,0,.18)",
            },
          },
        }}
      />
    </>
  );
}
