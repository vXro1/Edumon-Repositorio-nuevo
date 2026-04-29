// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { BookOpen, TrendingUp, Users, GraduationCap, ChevronRight, Search } from "lucide-react";
import { useToast } from "@/components/feedback/index";

import EdumonButton from "@/components/ui/Button";
import EdumonCard, { EdumonStatCard, EdumonProgress, EdumonBadge as CardBadge } from "@/components/ui/Card";
import EdumonDropdown from "@/components/ui/Dropdown";
import EdumonInput from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Footer from "@/components/ui/footer";
import Avatar from "@/components/ui/Avatar";
import { EdumonNotifBadge } from "@/components/ui/Badge";

import logo from "@/assets/icons/logo.svg";
import edumonImg from "@/assets/img/edumon.png";

/* ─── MOCK DATA ─── */
const USER = { name: "Ana Sofia", initials: "AS", notifications: 3 };

const COURSES = [
  {
    id: 1,
    title: "Calculo Diferencial",
    subject: "Matematicas",
    instructor: "Dr. Ramirez",
    progress: 68,
    variant: "info",
  },
  {
    id: 2,
    title: "Fisica Mecanica",
    subject: "Ciencias",
    instructor: "Prof. Torres",
    progress: 45,
    variant: "warning",
  },
  {
    id: 3,
    title: "Desarrollo Full-Stack",
    subject: "Tecnologia",
    instructor: "Ing. Garcia",
    progress: 92,
    variant: "success",
  },
];

const STATS = [
  { value: "12",  label: "Cursos activos",  icon: <BookOpen  className="w-5 h-5" /> },
  { value: "68%", label: "Progreso total",  icon: <TrendingUp className="w-5 h-5" /> },
  { value: "284", label: "Estudiantes",     icon: <Users      className="w-5 h-5" /> },
];

const FOOTER_COLUMNS = [
  {
    title: "Producto",
    links: [
      { label: "Cursos",      href: "#" },
      { label: "Precios",     href: "#" },
      { label: "Novedades",   href: "#" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Acerca de",   href: "#" },
      { label: "Contacto",    href: "#" },
    ],
  },
  {
    title: "Soporte",
    links: [
      { label: "Ayuda",       href: "#" },
      { label: "Privacidad",  href: "#" },
    ],
  },
];

/* ─── SUBCOMPONENTS ─── */
function ProgressRing({ value = 0, size = 80, stroke = 8 }) {
  const r     = (size - stroke) / 2;
  const circ  = 2 * Math.PI * r;
  const dash  = (value / 100) * circ;

  return (
    <svg width={size} height={size} aria-hidden="true" className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="white"
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
    </svg>
  );
}

/* ─── PAGE ─── */
const ROL_LABELS = {
  superadmin:    "Superadministrador",
  administrador: "Administrador",
  docente:       "Docente",
  "padre/tutor": "Padre / Tutor",
};

export default function Home() {
  const location = useLocation();
  const { showToast, ToastRenderer } = useToast();
  const [search, setSearch]         = useState("");
  const [modal, setModal]           = useState(false);
  const [selectedCourse, setSelect] = useState(null);
  const [filterKey, setFilterKey]   = useState("all");

  useEffect(() => {
    if (location.state?.loginSuccess) {
      const nombre = location.state.nombre ?? "";
      const rol    = ROL_LABELS[location.state.rol] ?? location.state.rol ?? "usuario";
      showToast(`Bienvenido/a${nombre ? `, ${nombre}` : ""}. Ingresaste como ${rol}.`, "success");
      window.history.replaceState({}, "");
    }
  }, []);

  const filtered = COURSES.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
                        c.subject.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filterKey === "all"       ? true :
      filterKey === "progress"  ? c.progress > 0 && c.progress < 100 :
      filterKey === "done"      ? c.progress === 100 :
      true;
    return matchSearch && matchFilter;
  });

  const openCourse = (course) => {
    setSelect(course);
    setModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-background)" }}>

      {/* ─── SKIP LINK ─── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold focus:text-white focus:text-sm"
        style={{ background: "var(--color-primary)" }}
      >
        Ir al contenido principal
      </a>

      {/* ─── HEADER ─── */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{
          background: "rgba(255,255,255,0.85)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">

          {/* LOGO */}
          <a href="/" aria-label="Edumon — inicio" className="flex items-center gap-2 shrink-0 mr-2">
            <img src={logo} alt="" aria-hidden="true" className="w-7 h-7" />
            <span className="font-extrabold text-base hidden sm:inline" style={{ color: "var(--color-text)" }}>
              edu<span style={{ color: "var(--color-primary)" }}>mon</span>
            </span>
          </a>

          {/* SEARCH */}
          <div className="flex-1 max-w-sm hidden md:block">
            <label htmlFor="header-search" className="sr-only">Buscar cursos</label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                aria-hidden="true"
                style={{ color: "var(--color-text-muted)" }}
              />
              <input
                id="header-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cursos..."
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border outline-none transition-all duration-200 focus:ring-2"
                style={{
                  background:   "var(--color-surface)",
                  borderColor:  "var(--color-border)",
                  color:        "var(--color-text)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-primary)";
                  e.currentTarget.style.boxShadow   = "0 0 0 3px var(--color-primary-light)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.boxShadow   = "none";
                }}
              />
            </div>
          </div>

          {/* SPACER */}
          <div className="flex-1" />

          {/* NOTIFICATION + USER */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                aria-label={`${USER.notifications} notificaciones`}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
                style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              {USER.notifications > 0 && (
                <span className="absolute -top-1 -right-1">
                  <EdumonNotifBadge count={USER.notifications} />
                </span>
              )}
            </div>

            <EdumonDropdown
              label={USER.name}
              avatarText={USER.initials}
              variant="ghost"
              align="right"
              options={[
                { id: "profile", label: "Mi perfil",  icon: <GraduationCap className="w-4 h-4" /> },
                { id: "settings", label: "Ajustes" },
                { id: "logout",  label: "Cerrar sesion", danger: true },
              ]}
              onSelect={(opt) => console.log("selected", opt.id)}
            />
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main id="main-content" className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6">

        {/* ─── HERO ─── */}
        <section aria-labelledby="hero-heading" className="py-10 md:py-14">
          <div className="grid lg:grid-cols-2 gap-10 items-center">

            {/* TEXT SIDE */}
            <div className="space-y-6">
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "var(--color-primary)" }}
              >
                Bienvenido de vuelta
              </p>

              <h1
                id="hero-heading"
                className="text-3xl md:text-5xl font-extrabold leading-tight"
                style={{ color: "var(--color-text)" }}
              >
                Continua tu aprendizaje,{" "}
                <span style={{ background: "var(--gradient-text)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {USER.name}
                </span>
              </h1>

              <p className="text-base md:text-lg leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                Avanza en tu formacion y alcanza tus metas con Edumon.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <EdumonButton variant="primary" onClick={() => {}}>
                  Explorar cursos
                </EdumonButton>
                <EdumonButton variant="secondary" onClick={() => {}}>
                  Ver logros
                </EdumonButton>
              </div>
            </div>

            {/* VISUAL PANEL */}
            <div
              aria-hidden="true"
              className="hidden lg:flex flex-col items-center justify-center h-72 rounded-2xl overflow-hidden relative"
              style={{ background: "var(--gradient-brand)" }}
            >
              {/* Background decorative circles */}
              <div className="absolute w-56 h-56 rounded-full opacity-10 top-[-40px] right-[-40px]"
                style={{ border: "2px solid white" }} />
              <div className="absolute w-36 h-36 rounded-full opacity-10 bottom-[-20px] left-[-20px]"
                style={{ border: "2px solid white" }} />

              {/* Edumon image overlay */}
              <img
                src={edumonImg}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay"
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center gap-5 text-white">
                <ProgressRing value={68} />
                <div className="text-center">
                  <p className="text-3xl font-extrabold">68%</p>
                  <p className="text-sm text-white/80 mt-1">Progreso general</p>
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <p className="text-xl font-bold">12</p>
                    <p className="text-xs text-white/70">Cursos</p>
                  </div>
                  <div className="h-full w-px bg-white/20" />
                  <div>
                    <p className="text-xl font-bold">284</p>
                    <p className="text-xs text-white/70">Estudiantes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── STATS ─── */}
        <section aria-labelledby="stats-heading" className="py-6">
          <h2
            id="stats-heading"
            className="text-xl font-bold mb-5"
            style={{ color: "var(--color-text)" }}
          >
            Tu desempeno
          </h2>

          <div className="grid sm:grid-cols-3 gap-4">
            {STATS.map((s) => (
              <EdumonStatCard key={s.label} value={s.value} label={s.label} icon={s.icon} />
            ))}
          </div>
        </section>

        {/* ─── COURSES ─── */}
        <section aria-labelledby="courses-heading" className="py-6 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2
              id="courses-heading"
              className="text-xl font-bold"
              style={{ color: "var(--color-text)" }}
            >
              Tus cursos
            </h2>

            <div className="flex items-center gap-3">
              {/* Mobile search */}
              <div className="md:hidden flex-1">
                <EdumonInput
                  label="Buscar"
                  iconLeft="search"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <EdumonDropdown
                label="Filtrar"
                variant="ghost"
                align="right"
                options={[
                  { id: "all",      label: "Todos" },
                  { id: "progress", label: "En progreso" },
                  { id: "done",     label: "Completados" },
                ]}
                onSelect={(opt) => setFilterKey(opt.id)}
              />
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((course) => (
                <EdumonCard
                  key={course.id}
                  title={course.title}
                  description={`Instructor: ${course.instructor}`}
                  badges={[{ label: course.subject }]}
                  onClick={() => openCourse(course)}
                  footerRight={
                    <button
                      type="button"
                      aria-label={`Ver ${course.title}`}
                      className="flex items-center gap-1 text-xs font-semibold transition-colors duration-150"
                      style={{ color: "var(--color-primary)" }}
                    >
                      Ver curso
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  }
                >
                  <EdumonProgress value={course.progress} />
                </EdumonCard>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center py-16 rounded-2xl border"
              style={{
                background:   "var(--color-surface)",
                borderColor:  "var(--color-border)",
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}
              >
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="font-semibold mb-1" style={{ color: "var(--color-text)" }}>
                Sin resultados
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                No se encontraron cursos para tu busqueda.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* ─── MODAL ─── */}
      <Modal
        isOpen={modal}
        onClose={() => { setModal(false); setSelect(null); }}
        title={selectedCourse?.title ?? "Curso"}
        description={selectedCourse ? `${selectedCourse.subject} — ${selectedCourse.instructor}` : undefined}
        size="md"
      >
        {selectedCourse && (
          <div className="space-y-4">
            <EdumonProgress value={selectedCourse.progress} />
            <div className="flex gap-3 pt-2">
              <EdumonButton variant="primary" size="md">
                Continuar
              </EdumonButton>
              <EdumonButton variant="ghost" size="md" onClick={() => setModal(false)}>
                Cerrar
              </EdumonButton>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── FOOTER ─── */}
      <Footer
        brandDescription="Transformando la educacion digital con Edumon."
        columns={FOOTER_COLUMNS}
        copyright="2026 Edumon. Todos los derechos reservados."
      />

      <ToastRenderer />
    </div>
  );
}
