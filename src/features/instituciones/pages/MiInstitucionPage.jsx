// src/features/instituciones/pages/MiInstitucionPage.jsx
// ROL: Administrador — detalle de la institución propia
import { useState, useEffect } from "react";
import {
  Building2, Phone, Mail, MapPin, Hash, Users,
  BookOpen, RefreshCw, Shield, Calendar, GraduationCap,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { institucionesGetMine, cursosGetAll, usersGetAll } from "@/lib/apiClient";
import { humanizeError } from "@/utils/humanizeError";
import {Badge} from "@/components";

function Sk({ h = 16, w = "100%", r = 7 }) {
  return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, background: "var(--color-border)" }} />;
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 0", borderBottom: "1px solid var(--color-border)" }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(12,106,196,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
        <Icon style={{ width: 15, height: 15, color: "#0C6AC4" }} />
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text)", marginTop: 2 }}>{value ?? "—"}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg, loading }) {
  return (
    <div style={{ background: "var(--color-surface)", borderRadius: 14, padding: "18px 20px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 11, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon style={{ width: 19, height: 19, color }} />
      </div>
      <div>
        {loading ? (
          <>
            <Sk h={24} w={50} r={5} />
            <div style={{ marginTop: 5 }}><Sk h={12} w={80} r={4} /></div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)", margin: 0, lineHeight: 1 }}>{value}</p>
            <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", marginTop: 3 }}>{label}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function MiInstitucionPage() {
  const { user } = useAuth();
  const [inst,    setInst]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [stats,   setStats]   = useState({ cursos: 0, docentes: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await institucionesGetMine();
        setInst(res.institucion ?? res);
      } catch (err) {
        setError(humanizeError(err, "No se pudo cargar la institución"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setStatsLoading(true);
      try {
        const [cursosRes, docentesRes] = await Promise.all([
          cursosGetAll({ limit: 1 }),
          usersGetAll({ rol: "docente", limit: 1 }),
        ]);
        setStats({
          cursos:   cursosRes.pagination?.total ?? cursosRes.cursos?.length ?? 0,
          docentes: docentesRes.pagination?.totalUsers ?? docentesRes.users?.length ?? 0,
        });
      } catch { /* silencioso */ }
      finally { setStatsLoading(false); }
    })();
  }, []);

  if (error) {
    return (
      <div style={{ maxWidth: 700, margin: "40px auto", background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", padding: "40px 32px", textAlign: "center" }}>
        <AlertCircle style={{ width: 36, height: 36, color: "#DC2626", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text)" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>

      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(12,106,196,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Building2 style={{ width: 19, height: 19, color: "#0C6AC4" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>Mi institución</h1>
          <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: 0 }}>Información y configuración institucional</p>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard icon={BookOpen}       label="Cursos activos"  value={stats.cursos}   color="#0C6AC4" bg="rgba(12,106,196,0.10)" loading={statsLoading} />
        <StatCard icon={GraduationCap}  label="Docentes"        value={stats.docentes} color="#16A34A" bg="rgba(22,163,74,0.10)"  loading={statsLoading} />
        <StatCard icon={Users}          label="Estudiantes"     value="—"              color="#6366F1" bg="rgba(99,102,241,0.10)" loading={false} />
        <StatCard icon={Shield}         label="Administradores" value="1"              color="#D97706" bg="rgba(217,119,6,0.10)"  loading={false} />
      </div>

      {/* ── Main content grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(0,1fr)", gap: 20 }}>

        {/* Institution info card */}
        <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>Información institucional</h2>
            {loading && <div className="animate-pulse" style={{ width: 80, height: 20, borderRadius: 6, background: "var(--color-border)" }} />}
          </div>

          <div style={{ padding: "4px 20px 8px" }}>
            {loading ? (
              [0,1,2,3,4].map((i) => (
                <div key={i} style={{ padding: "13px 0", borderBottom: "1px solid var(--color-border)", display: "flex", gap: 12, alignItems: "center" }}>
                  <Sk h={34} w={34} r={9} />
                  <div style={{ flex: 1 }}>
                    <Sk h={11} w={60} r={4} />
                    <div style={{ marginTop: 5 }}><Sk h={15} w="70%" r={5} /></div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <InfoRow icon={Building2} label="Nombre"    value={inst?.nombre} />
                <InfoRow icon={Hash}      label="NIT"       value={inst?.nit} />
                <InfoRow icon={Hash}      label="Código"    value={inst?.codigo} />
                <InfoRow icon={MapPin}    label="Dirección" value={inst?.direccion} />
                <InfoRow icon={Phone}     label="Teléfono"  value={inst?.telefono} />
                <InfoRow icon={Mail}      label="Correo"    value={inst?.correo} />
              </>
            )}
          </div>
        </div>

        {/* Admin info + dates */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Admin card */}
          <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>Tu cuenta</h2>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #0C6AC4, #1D4ED8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white", flexShrink: 0 }}>
                  {user?.nombre?.[0]?.toUpperCase() ?? "A"}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>{user?.nombre} {user?.apellido}</p>
                  <p style={{ fontSize: 12.5, color: "var(--color-text-muted)", margin: 0 }}>{user?.correo}</p>
                  <div style={{ marginTop: 4 }}>
                    <Badge variant="info" size="sm">Administrador</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System info card */}
          <div style={{ background: "var(--color-surface)", borderRadius: 16, border: "1px solid var(--color-border)", boxShadow: "var(--shadow-card)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: 0 }}>Estado del sistema</h2>
            </div>
            <div style={{ padding: "12px 20px" }}>
              {[
                { label: "Estado", val: "Activo",        variant: "success" },
                { label: "Plan",   val: "Profesional",   variant: "info"    },
              ].map(({ label, val, variant }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{label}</span>
                  <Badge variant={variant} dot>{val}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}