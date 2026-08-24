import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";

// Etiqueta estática para segmentos de ruta conocidos
const SEGMENT_LABELS = {
  admin:          "Inicio",
  docente:        "Inicio",
  padre:          "Inicio",
  cursos:         "Cursos",
  curso:          "Cursos",
  tareas:         "Retos",
  entregas:       "Entregas",
  foros:          "Foros",
  foro:           "Foro",
  eventos:        "Eventos",
  calendario:     "Calendario",
  perfil:         "Mi Perfil",
  notificaciones: "Notificaciones",
  buzon:          "Buzón",
  instituciones:  "Instituciones",
  institucion:    "Mi Institución",
  usuarios:       "Usuarios",
  docentes:       "Docentes",
  familia:        "Familia",
  perfiles:       "Perfiles",
  sesiones:       "Sesiones",
  dashboard:      "Inicio",
};

// Etiqueta para el query-param ?tab=
const TAB_LABELS = {
  general:       "General",
  modulos:       "Módulos",
  tareas:        "Retos",
  foros:         "Foros",
  participantes: "Participantes",
  entregas:      "Entregas",
  calendario:    "Calendario",
};

// Segmentos que parecen IDs (ObjectId Mongo o UUID)
const isId = (s) => /^[0-9a-f]{24}$/i.test(s) || /^[0-9a-f-]{36}$/i.test(s);

function buildCrumbs(pathname, searchParams, titles) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return [];

  const crumbs = [];
  let accumulated = "";

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    accumulated += `/${seg}`;

    if (isId(seg)) {
      // Segmento dinámico: buscar título registrado
      const label = titles[accumulated] ?? titles[pathname] ?? "…";
      crumbs.push({ label, path: accumulated });
    } else {
      const label = SEGMENT_LABELS[seg];
      if (label) {
        crumbs.push({ label, path: accumulated });
      }
    }
  }

  // Añadir crumb del tab activo si estamos en /cursos/:id o /curso/:id/...
  const tab = searchParams.get("tab");
  if (tab && TAB_LABELS[tab]) {
    const last = crumbs[crumbs.length - 1];
    if (last && last.path === pathname) {
      // ya está, no duplicar
    } else {
      crumbs.push({ label: TAB_LABELS[tab], path: `${pathname}?tab=${tab}` });
    }
  }

  return crumbs;
}

export default function Breadcrumbs() {
  const { pathname }    = useLocation();
  const [searchParams]  = useSearchParams();
  const ctx             = useBreadcrumbContext();
  const titles          = ctx?.titles ?? {};

  const crumbs = buildCrumbs(pathname, searchParams, titles);

  // No mostrar breadcrumbs en la raíz o en rutas de primer nivel
  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Migas de pan"
      style={{
        display:    "flex",
        alignItems: "center",
        flexWrap:   "wrap",
        gap:        2,
        padding:    "10px 0 14px",
        fontSize:   12.5,
        color:      "var(--color-text-muted)",
        lineHeight: 1,
      }}
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.path} style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {i > 0 && (
              <ChevronRight
                size={12}
                style={{ color: "var(--color-text-muted)", opacity: 0.5, flexShrink: 0 }}
              />
            )}
            {isLast ? (
              <span style={{ color: "var(--color-text)", fontWeight: 600 }}>
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                style={{
                  color:          "var(--color-text-muted)",
                  textDecoration: "none",
                  borderRadius:   4,
                  padding:        "1px 3px",
                  transition:     "color 120ms",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
