import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, RefreshCw, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { sesionesService } from "../../../services/sesionesService";
import { SessionCard } from "../components/SessionCard";

const PAGE_SIZE = 8;

const SkeletonCard = () => (
  <div
    style={{
      background:    "var(--color-surface, #fff)",
      border:        "1px solid var(--color-border, #e5e7eb)",
      borderRadius:  14,
      padding:       "16px 18px",
      display:       "flex",
      gap:           14,
      alignItems:    "center",
    }}
  >
    <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--color-surface-2, #f3f4f6)", animation: "skeleton-pulse 1.4s ease-in-out infinite" }} />
    <div style={{ flex: 1 }}>
      <div style={{ width: "40%", height: 13, borderRadius: 6, background: "var(--color-surface-2, #f3f4f6)", marginBottom: 8, animation: "skeleton-pulse 1.4s ease-in-out infinite" }} />
      <div style={{ width: "65%", height: 11, borderRadius: 6, background: "var(--color-surface-2, #f3f4f6)", animation: "skeleton-pulse 1.4s ease-in-out infinite" }} />
    </div>
    <div style={{ width: 80, height: 11, borderRadius: 6, background: "var(--color-surface-2, #f3f4f6)", animation: "skeleton-pulse 1.4s ease-in-out infinite" }} />
  </div>
);

export const SesionesPage = () => {
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey:  ["sesiones", page],
    queryFn:   () => sesionesService.getUltimas({ page, limit: PAGE_SIZE }),
    staleTime: 30_000,
    keepPreviousData: true,
  });

  const sesiones  = data?.sesiones   ?? data?.data    ?? [];
  const total     = data?.total      ?? sesiones.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1;   }
          50%       { opacity: 0.4; }
        }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>

        {/* ── Cabecera ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width:          40,
                height:         40,
                borderRadius:   12,
                background:     "rgba(12,106,196,0.10)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                color:          "var(--color-primary)",
              }}
            >
              <Shield size={20} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--color-text, #111)", fontFamily: "var(--font-display)" }}>
                Sesiones activas
              </h1>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--color-text-muted, #6b7280)" }}>
                Dispositivos que han accedido a tu cuenta
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Actualizar sesiones"
            style={{
              background:   "var(--color-surface, #fff)",
              border:       "1px solid var(--color-border, #e5e7eb)",
              borderRadius: 10,
              padding:      "8px 10px",
              cursor:       isFetching ? "not-allowed" : "pointer",
              display:      "flex",
              alignItems:   "center",
              gap:          6,
              fontSize:     12.5,
              fontWeight:   600,
              color:        "var(--color-text-muted, #6b7280)",
              transition:   "background 0.15s, color 0.15s",
              opacity:      isFetching ? 0.6 : 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--color-surface-2, #f3f4f6)"; e.currentTarget.style.color = "var(--color-text, #111)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--color-surface, #fff)"; e.currentTarget.style.color = "var(--color-text-muted, #6b7280)"; }}
          >
            <RefreshCw
              size={14}
              style={{
                animation: isFetching ? "auth-spin 0.7s linear infinite" : "none",
              }}
            />
            Actualizar
          </button>
        </div>

        {/* ── Estado de error ── */}
        {isError && (
          <div
            style={{
              display:      "flex",
              alignItems:   "center",
              gap:          10,
              background:   "rgba(239,68,68,0.07)",
              border:       "1px solid rgba(239,68,68,0.2)",
              borderRadius: 12,
              padding:      "14px 16px",
              marginBottom: 20,
              color:        "var(--color-error-hover)",
              fontSize:     13.5,
            }}
          >
            <AlertCircle size={16} />
            {error?.message ?? "Error al cargar las sesiones. Intenta de nuevo."}
          </div>
        )}

        {/* ── Lista ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : sesiones.length === 0
              ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted, #6b7280)" }}>
                  <Shield size={36} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p style={{ fontSize: 14, margin: 0 }}>No hay sesiones registradas</p>
                </div>
              )
              : sesiones.map((s, idx) => (
                  <SessionCard key={s._id ?? s.id ?? idx} sesion={s} isCurrent={idx === 0 && page === 1} />
                ))
          }
        </div>

        {/* ── Paginación ── */}
        {!isLoading && totalPages > 1 && (
          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              marginTop:      20,
              padding:        "12px 4px 0",
              borderTop:      "1px solid var(--color-border, #e5e7eb)",
            }}
          >
            <span style={{ fontSize: 12.5, color: "var(--color-text-muted, #6b7280)" }}>
              Página {page} de {totalPages}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft size={14} />
              </PagBtn>
              <PagBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight size={14} />
              </PagBtn>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const PagBtn = ({ children, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      width:        34,
      height:       34,
      borderRadius: 8,
      border:       "1px solid var(--color-border, #e5e7eb)",
      background:   "var(--color-surface, #fff)",
      cursor:       disabled ? "not-allowed" : "pointer",
      display:      "flex",
      alignItems:   "center",
      justifyContent: "center",
      color:        disabled ? "var(--color-border, #d1d5db)" : "var(--color-text, #374151)",
      transition:   "background 0.15s",
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = "var(--color-surface-2, #f3f4f6)"; }}
    onMouseLeave={e => { e.currentTarget.style.background = "var(--color-surface, #fff)"; }}
  >
    {children}
  </button>
);

export default SesionesPage;
