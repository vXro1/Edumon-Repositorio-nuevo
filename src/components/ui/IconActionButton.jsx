import { memo } from "react";

// `title` sigue siendo el tooltip nativo del navegador (hover); ahora
// también se pinta como texto visible junto al ícono — un ícono solo no le
// dice a un usuario adulto qué acción hace el botón sin pasar el mouse
// por encima primero (ver plan de corrección UX/UI).
const IconActionButton = memo(function IconActionButton({
  icon: Icon,
  color = "var(--color-text-muted)",
  onClick,
  title,
  disabled = false,
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 32,
        padding: "0 10px",
        borderRadius: 8,
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 700,
        color: "var(--color-text-muted)",
        whiteSpace: "nowrap",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 150ms",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--color-bg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--color-surface)";
      }}
    >
      <Icon style={{ width: 15, height: 15, color, flexShrink: 0 }} />
      {title}
    </button>
  );
});

export default IconActionButton;