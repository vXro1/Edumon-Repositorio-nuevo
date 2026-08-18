// src/features/familia/pages/FamiliaCalendarioPage.jsx
import { useState, useEffect, useCallback } from "react";
import { Calendar } from "lucide-react";
import { cursosGetMine } from "@/features/cursos/services/cursosService";
import { calendarioGetByCurso } from "@/features/calendario/services/calendarioService";
import CalendarWidget from "@/components/ui/CalendarWidget";
import { Button } from "@/components";

export default function FamiliaCalendarioPage() {
  const [items,    setItems]    = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [apiError, setApiError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setApiError(false);
    try {
      const cursosRes = await cursosGetMine({ limit: 50 });
      const cursos    = cursosRes?.cursos ?? [];

      // Acumuladores para stats globales
      let totalTareas = 0, totalEventos = 0, tareasVencidas = 0, eventosProximos = 0;
      const allItems  = [];
      const ahora     = new Date();

      await Promise.all(
        cursos.map(async (c) => {
          try {
            const res = await calendarioGetByCurso(c._id);
            const entries = res?.items ?? [];

            entries.forEach(item => {
              // Añadir nombre del curso a cada item para mostrarlo en el modal
              allItems.push({ ...item, cursoNombre: c.nombre ?? "Sin nombre" });
            });

            // Acumular estadísticas
            const st = res?.estadisticas;
            if (st) {
              totalTareas     += st.totalTareas     ?? 0;
              totalEventos    += st.totalEventos    ?? 0;
              tareasVencidas  += st.tareasVencidas  ?? 0;
              eventosProximos += st.eventosProximos ?? 0;
            }
          } catch { /* ignorar errores de cursos individuales */ }
        })
      );

      allItems.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
      setItems(allItems);
      setStats({ totalTareas, totalEventos, tareasVencidas, eventosProximos });
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: "rgba(22,163,74,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Calendar size={20} style={{ color: "var(--edu-green-600)" }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text)" }}>
            Calendario familiar
          </h1>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            Tareas y eventos de todos tus cursos
          </p>
        </div>
      </div>

      {/* Error de carga */}
      {apiError ? (
        <div style={{
          textAlign: "center", padding: "48px 24px",
          background: "var(--color-surface)", borderRadius: 16,
          border: "1px solid var(--color-border)",
        }}>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 16 }}>
            No se pudo cargar el calendario.
          </p>
          <Button onClick={load}>Reintentar</Button>
        </div>
      ) : (
        <CalendarWidget
          items={items}
          loading={loading}
          stats={stats}
          canManage={false}
          onRefresh={load}
          title="Calendario familiar"
        />
      )}
    </div>
  );
}
