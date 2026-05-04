// src/features/cursos/components/entregas/EntregasTab.jsx
import { useState, useEffect, useCallback } from "react";
import { entregasGetByTarea, entregasGetMineByTarea, entregasEnviar } from "@/lib/apiClient";
import { Badge, Button, UserAvatar, Toast } from "@/components";
import { Sk, ESTADO_VARIANT } from "../shared/ui";
import { makeNotify } from "../shared/helpers";
import { Plus } from "lucide-react";

export default function EntregasTab({ tarea, canGrade, esPadre, onGrade, onBack, onRealizarEntrega }) {
  const [entregas, setEntregas] = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(null);
  const [toast, setToast]       = useState({ msg: "", type: "success" });
  const notify = makeNotify(setToast);

  const fetchData = useCallback(() => {
    setLoading(true);
    const req = esPadre ? entregasGetMineByTarea(tarea._id) : entregasGetByTarea(tarea._id);
    req
      .then((res) => {
        const lista = esPadre
          ? (Array.isArray(res) ? res : res.data ?? res.entregas ?? [])
          : (res.entregas ?? []);
        setEntregas(Array.isArray(lista) ? lista : []);
        if (!esPadre) setStats(res.estadisticas ?? null);
      })
      .catch(() => { setEntregas([]); setStats(null); })
      .finally(() => setLoading(false));
  }, [tarea._id, esPadre]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEnviar = async (ent) => {
    setSending(ent._id);
    try {
      await entregasEnviar(ent._id);
      notify("Entrega enviada");
      fetchData();
    } catch {
      notify("Error al enviar entrega", "error");
    } finally {
      setSending(null);
    }
  };

  const listaSegura = Array.isArray(entregas) ? entregas : [];
  const puedeNuevaEntrega = esPadre && !listaSegura.some((e) => e.estado !== "borrador");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Toast {...toast} />

      {/* Stats (docente) */}
      {stats && (
        <div style={{ padding: "12px 16px", background: "var(--color-bg)", borderRadius: 9,
          border: "1px solid var(--color-border)", display: "flex", gap: 16, fontSize: 12,
          color: "var(--color-text-muted)" }}>
          <span>Total: <strong style={{ color: "var(--color-text)" }}>{stats.total}</strong></span>
          <span style={{ color: "var(--color-primary)" }}>Enviadas: <strong>{stats.enviadas}</strong></span>
          <span style={{ color: "var(--color-success)" }}>Calificadas: <strong>{stats.calificadas}</strong></span>
        </div>
      )}

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {loading ? (
          <Sk h={40} r={8} />
        ) : listaSegura.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10,
            padding: "8px 0" }}>
            <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: 0 }}>
              {esPadre ? "Aún no has entregado esta tarea." : "Ningún alumno ha entregado."}
            </p>
            {esPadre && onRealizarEntrega && (
              <Button size="sm" variant="primary" onClick={onRealizarEntrega}
                style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Plus style={{ width: 13, height: 13 }} /> Realizar entrega
              </Button>
            )}
          </div>
        ) : (
          <>
            {listaSegura.map((ent) => {
              const autor  = ent.padreId ?? null;
              const nombre = autor
                ? `${autor.nombre ?? ""} ${autor.apellido ?? ""}`.trim()
                : esPadre ? "Mi entrega" : "—";

              return (
                <div key={ent._id} style={{ display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 12px", borderRadius: 9, border: "1px solid var(--color-border)",
                  background: "var(--color-bg)" }}>
                  {!esPadre && <UserAvatar user={autor} size={30} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
                      {nombre}
                    </p>
                    {ent.textoRespuesta && (
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-text-muted)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ent.textoRespuesta}
                      </p>
                    )}
                    {ent.calificacion && (
                      <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-success)",
                        fontWeight: 600 }}>
                        Nota: {ent.calificacion.nota}
                        {ent.calificacion.comentario && ` — ${ent.calificacion.comentario}`}
                      </p>
                    )}
                  </div>
                  <Badge variant={ESTADO_VARIANT?.[ent.estado] ?? "neutral"} styleType="soft" size="sm">
                    {ent.estado}
                  </Badge>
                  {canGrade && ent.estado !== "borrador" && (
                    <Button size="sm" variant={ent.calificacion ? "secondary" : "primary"}
                      onClick={() => onGrade(ent)}>
                      {ent.calificacion ? "Editar" : "Calificar"}
                    </Button>
                  )}
                  {esPadre && ent.estado === "borrador" && (
                    <Button size="sm" variant="primary" disabled={sending === ent._id}
                      onClick={() => handleEnviar(ent)}>
                      {sending === ent._id ? "Enviando..." : "Enviar"}
                    </Button>
                  )}
                </div>
              );
            })}

            {/* Botón nueva entrega si no hay ninguna enviada/calificada */}
            {puedeNuevaEntrega && onRealizarEntrega && (
              <Button size="sm" variant="ghost" onClick={onRealizarEntrega}
                style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6 }}>
                <Plus style={{ width: 13, height: 13 }} /> Nueva entrega
              </Button>
            )}
          </>
        )}
      </div>

      {/* Volver */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 10,
        borderTop: "1px solid var(--color-border)", marginTop: 10 }}>
        <Button variant="ghost" onClick={onBack}>← Volver a tarea</Button>
      </div>
    </div>
  );
}
