// directorio de foros por curso — al hacer clic navega a la vista canónica
// del foro (ForumPage, /curso/:cursoId/foro/:foroId) en vez de reimplementarla
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare, Search, ChevronRight, AlertCircle,
  Lock, BookOpen, Users,
} from "lucide-react";

import { cursosGetMine } from "@/features/cursos/services/cursosService";
import { forosGetByCurso } from "@/features/foros/services/forosService";
import { normalizeCurso, normalizeForos } from "@/lib/normalizers";

import { Badge } from "@/components";
import { Sk, EmptyState } from "@/features/cursos/components/shared/ui";

function formatFecha(fechaStr) {
  if (!fechaStr) return null;
  return new Date(fechaStr).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

function ForoRow({ foro, onClick }) {
  const cerrado = foro.estado === "cerrado";
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "14px 18px", borderBottom: "1px solid var(--color-border)",
        cursor: "pointer", transition: "background 150ms",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: cerrado ? "rgba(107,114,128,0.10)" : "rgba(99,102,241,0.10)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {cerrado
          ? <Lock style={{ width: 16, height: 16, color: "#6B7280" }} />
          : <MessageSquare style={{ width: 16, height: 16, color: "#6366F1" }} />
        }
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 600, margin: 0,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {foro.titulo}
        </p>
        {foro.descripcion && (
          <p style={{
            fontSize: 12, color: "var(--color-text-muted)", margin: "3px 0 0",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {foro.descripcion}
          </p>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 5, flexWrap: "wrap" }}>
          <span style={{ display: "flex", gap: 4, fontSize: 11.5, color: "var(--color-text-muted)" }}>
            <MessageSquare style={{ width: 11, height: 11 }} />
            {foro.totalMensajes ?? 0} mensajes
          </span>
          {foro.createdAt && (
            <span style={{ fontSize: 11.5, color: "var(--color-text-muted)" }}>
              Creado {formatFecha(foro.createdAt)}
            </span>
          )}
        </div>
      </div>

      <Badge variant={cerrado ? "neutral" : "success"} size="sm" dot>
        {cerrado ? "Cerrado" : "Abierto"}
      </Badge>

      <ChevronRight style={{ width: 16, height: 16, color: "var(--color-text-muted)", flexShrink: 0 }} />
    </div>
  );
}

function CursoForosGroup({ curso, foros, onOpenForo }) {
  return (
    <div style={{
      background: "var(--color-surface)", borderRadius: 16,
      border: "1px solid var(--color-border)", boxShadow: "var(--clay-card)",
      overflow: "hidden", marginBottom: 16,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 18px", borderBottom: "1px solid var(--color-border)",
        background: "var(--color-bg)",
      }}>
        <BookOpen style={{ width: 15, height: 15, color: "var(--color-text-muted)" }} />
        <p style={{ fontSize: 13.5, fontWeight: 700, margin: 0 }}>{curso.nombre}</p>
      </div>

      {foros.length === 0 ? (
        <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: 0, padding: "16px 18px" }}>
          Sin foros todavía en este curso.
        </p>
      ) : (
        foros.map(f => (
          <ForoRow key={f._id} foro={f} onClick={() => onOpenForo(f, curso)} />
        ))
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
export default function FamiliaForosPage() {
  const navigate = useNavigate();

  const [grupos,  setGrupos]  = useState([]); // [{ curso, foros }]
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search,  setSearch]  = useState("");

  const load = async () => {
    setLoading(true);
    setApiError(false);
    try {
      const res = await cursosGetMine({ limit: 50 });
      const cursos = (res?.cursos ?? []).map(normalizeCurso);

      const conForos = await Promise.all(
        cursos.map(async (curso) => {
          try {
            const fr = await forosGetByCurso(curso._id);
            return { curso, foros: normalizeForos(fr?.foros ?? fr) };
          } catch {
            return { curso, foros: [] };
          }
        })
      );

      setGrupos(conForos);
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openForo = (foro, curso) => {
    navigate(`/curso/${curso._id}/foro/${foro._id}`, { state: { cursoNombre: curso.nombre } });
  };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? grupos
        .map(g => ({
          ...g,
          foros: g.foros.filter(f =>
            f.titulo?.toLowerCase().includes(q) ||
            g.curso.nombre?.toLowerCase().includes(q)
          ),
        }))
        .filter(g => g.foros.length > 0)
    : grupos;

  const totalForos = grupos.reduce((acc, g) => acc + g.foros.length, 0);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: "rgba(99,102,241,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Users style={{ width: 18, height: 18, color: "#6366F1" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Foros</h1>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: "2px 0 0" }}>
            {totalForos} foro{totalForos !== 1 ? "s" : ""} en tus cursos
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: 18,
        background: "var(--color-surface)", border: "1.5px solid var(--color-border)",
        borderRadius: 10, padding: "8px 12px", maxWidth: 320,
      }}>
        <Search style={{ width: 14, height: 14, color: "var(--color-text-muted)", flexShrink: 0 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar foro o curso…"
          style={{ border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: "var(--color-text)", flex: 1 }}
        />
      </div>

      {/* Error */}
      {apiError && (
        <div style={{
          background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)",
          borderRadius: 14, padding: "40px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center",
        }}>
          <AlertCircle style={{ width: 32, height: 32, color: "var(--color-error-hover)" }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", margin: 0 }}>No se pudieron cargar los foros</p>
          <button onClick={load} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--color-primary)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
            Reintentar
          </button>
        </div>
      )}

      {/* Lista */}
      {!apiError && (loading ? (
        [0, 1, 2].map(i => (
          <div key={i} style={{
            background: "var(--color-surface)", borderRadius: 16,
            border: "1px solid var(--color-border)", padding: "14px 18px",
            marginBottom: 12, display: "flex", gap: 14,
          }}>
            <Sk h={36} w={36} r={9} />
            <div style={{ flex: 1 }}>
              <Sk h={14} w="45%" />
              <div style={{ marginTop: 8 }}><Sk h={11} w="30%" /></div>
            </div>
          </div>
        ))
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={q ? "Sin resultados" : "Aún no hay foros"}
          desc={q ? "Prueba con otro término de búsqueda." : "Cuando tus docentes creen un foro, aparecerá aquí."}
        />
      ) : (
        filtered.map(g => (
          <CursoForosGroup key={g.curso._id} curso={g.curso} foros={g.foros} onOpenForo={openForo} />
        ))
      ))}
    </div>
  );
}
