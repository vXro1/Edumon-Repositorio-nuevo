import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  BookOpen, Search, ArrowUpRight, GraduationCap,
  Users, AlertCircle,
} from "lucide-react";

import { cursosGetMine } from "@/features/cursos/services/cursosService";
import letrasImg from "@/assets/img/letras.png";
import { normalizeCurso } from "@/lib/normalizers";
import CourseCard from "@/features/cursos/components/CursoCard";

import { Button } from "@/components";

const CARD_COLORS = [
  { strip: "var(--color-primary)", icon: "#1D4ED8", bg: "#EFF6FF" },
  { strip: "var(--edu-green-600)", icon: "#166534", bg: "#F0FDF4" },
  { strip: "#F23D7F", icon: "#B01B52", bg: "#FEF0F5" },
  { strip: "#EA580C", icon: "#9A3412", bg: "#FFF7ED" },
  { strip: "#0284C7", icon: "#075985", bg: "#F0F9FF" },
  { strip: "#D97706", icon: "#92400E", bg: "#FFFBEB" },
];

function Sk({ h = 14, w = "100%", r = 6 }) {
  return (
    <div
      className="animate-pulse"
      style={{
        height: h,
        width: w,
        borderRadius: r,
        background: "var(--color-border)",
      }}
    />
  );
}

function SkCard() {
  return (
    <div
      style={{
        background: "var(--color-surface)",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid var(--color-border)",
      }}
    >
      <Sk h={120} r={0} />
      <div style={{ padding: 16 }}>
        <Sk h={14} w="80%" />
        <div style={{ marginTop: 8 }}>
          <Sk h={11} w="50%" />
        </div>
      </div>
    </div>
  );
}

export default function FamiliaCursosPage() {
  const navigate = useNavigate();

  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setApiError(false);

    try {
      const res = await cursosGetMine({ limit: 50 });
      setCursos((res?.cursos ?? []).map(normalizeCurso));
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = search
    ? cursos.filter(
        (c) =>
          c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
          c.docente?.nombre?.toLowerCase().includes(search.toLowerCase())
      )
    : cursos;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>Mis cursos</h1>
          <p style={{ fontSize: 13 }}>
            {!loading &&
              `${cursos.length} curso${cursos.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* SEARCH */}
        <div>
          <Search size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar curso…"
          />
        </div>
      </div>

      {/* ERROR STATE */}
      {apiError && (
        <div
          style={{
            background: "rgba(220,38,38,0.06)",
            border: "1px solid rgba(220,38,38,0.2)",
            borderRadius: 14,
            padding: "40px 24px",
            textAlign: "center",
          }}
        >
          <AlertCircle size={32} />
          <p>No se pudieron cargar los cursos</p>

          <Button variant="primary" onClick={load}>
            Reintentar
          </Button>
        </div>
      )}

      {/* GRID */}
      {!apiError &&
        (loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {[0, 1, 2, 3].map((i) => (
              <SkCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <AlertCircle size={32} />
            <p>No hay cursos</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {filtered.map((c, i) => (
              <CourseCard
                key={c._id}
                curso={c}
                idx={i}
                showCover={true}
                coverSrc={c.fotoPortada || letrasImg}
                onClick={() => navigate(`/cursos/${c._id}`)}
              />
            ))}
          </div>
        ))}
    </div>
  );
}