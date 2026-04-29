// src/components/ui/footer.jsx
import logo from "@/assets/icons/logo.svg";

export default function Footer({
  brandDescription = "Transformando la educacion digital",
  columns = [],
  copyright = "2026 Edumon. Todos los derechos reservados.",
}) {
  return (
    <footer
      role="contentinfo"
      className="relative overflow-hidden mt-16"
      style={{
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      {/* Decorative ambient glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.07]">
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl -top-32 -left-20"
          style={{ background: "var(--color-primary)" }}
        />
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl -bottom-32 -right-20"
          style={{ background: "var(--color-secondary)" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">

          {/* BRAND */}
          <section aria-label="Edumon">
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="Edumon" className="w-7 h-7" />
              <span className="font-extrabold text-base" style={{ color: "var(--color-text)" }}>
                edu<span style={{ color: "var(--color-primary)" }}>mon</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-[240px]" style={{ color: "var(--color-text-muted)" }}>
              {brandDescription}
            </p>
          </section>

          {/* LINK COLUMNS */}
          {columns.map((col, i) => (
            <nav key={i} aria-label={col.title}>
              <h3
                className="text-xs font-bold uppercase tracking-wider mb-4"
                style={{ color: "var(--color-text)" }}
              >
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links?.map((link, j) => (
                  <li key={j}>
                    <a
                      href={link.href || "#"}
                      className="text-sm inline-block transition-all duration-200 hover:translate-x-0.5 focus:outline-none focus-visible:underline"
                      style={{ color: "var(--color-text-muted)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* DIVIDER */}
        <div
          className="mt-10 mb-6 h-px"
          style={{ background: "var(--color-border)" }}
          aria-hidden="true"
        />

        {/* COPYRIGHT */}
        <p className="text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
          &copy; {copyright}
        </p>
      </div>
    </footer>
  );
}
