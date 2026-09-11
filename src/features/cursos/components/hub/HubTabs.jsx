import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export default function HubTabs({ tabs, activeTab, onTabChange }) {
  const navRef = useRef(null);
  const btnRefs = useRef({});
  const mountedRef = useRef(false);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });
  // sin esto el indicador "nace" en 0 y desliza hasta el tab activo al cargar —
  // la transición solo debe correr cuando el usuario cambia de tab
  const [animate, setAnimate] = useState(false);

  const measure = useCallback(() => {
    const btn = btnRefs.current[activeTab];
    const nav = navRef.current;
    if (!btn || !nav) return;
    const navBox = nav.getBoundingClientRect();
    const btnBox = btn.getBoundingClientRect();
    setIndicator({ left: btnBox.left - navBox.left + nav.scrollLeft, width: btnBox.width, ready: true });
  }, [activeTab]);

  useLayoutEffect(() => {
    measure();
    if (!mountedRef.current) {
      mountedRef.current = true;
      // pinta la posición inicial sin transición, luego habilita la animación
      requestAnimationFrame(() => setAnimate(true));
    }
  }, [measure, tabs.length]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <nav
      ref={navRef}
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
        gap: 4,
        borderBottom: "2px solid var(--color-border)",
        marginBottom: 24,
        overflowX: "auto",
      }}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            ref={(el) => { btnRefs.current[tab.key] = el; }}
            onClick={() => onTabChange(tab.key)}
            className="hub-tab-btn"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "10px 16px",
              fontSize: 13.5,
              fontWeight: active ? 700 : 500,
              color: active ? "var(--color-primary)" : "var(--color-text-muted)",
              marginBottom: -2,
              whiteSpace: "nowrap",
              transition: "color 200ms ease, transform 150ms ease",
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: 8,
            }}
          >
            {tab.icon && <tab.icon style={{ width: 14, height: 14 }} />}
            {tab.label}
          </button>
        );
      })}

      {/* Indicador deslizante — se mueve y cambia de ancho con transition
          en vez de que cada tab prenda/apague su propio borde de golpe. */}
      <span
        aria-hidden="true"
        className="hub-tab-indicator"
        style={{
          position: "absolute",
          bottom: -2,
          left: 0,
          height: 3,
          borderRadius: 3,
          background: "var(--color-primary)",
          transform: `translateX(${indicator.left}px)`,
          width: indicator.width,
          opacity: indicator.ready ? 1 : 0,
          transition: animate
            ? "transform 280ms cubic-bezier(0.22,1,0.36,1), width 280ms cubic-bezier(0.22,1,0.36,1), opacity 150ms ease"
            : "none",
        }}
      />

      <style>{`
        .hub-tab-btn:hover { color: var(--color-primary) !important; background: var(--color-primary-light, rgba(12,106,196,0.08)); }
        .hub-tab-btn:active { transform: scale(0.96); }
        @media (prefers-reduced-motion: reduce) {
          .hub-tab-btn { transition: none !important; }
          .hub-tab-indicator { transition: none !important; }
        }
      `}</style>
    </nav>
  );
}
