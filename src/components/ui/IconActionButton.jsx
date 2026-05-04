import { memo } from "react";

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
        width: 32,
        height: 32,
        borderRadius: 8,
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 150ms",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--color-bg)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "var(--color-surface)";
      }}
    >
      <Icon style={{ width: 15, height: 15, color }} />
    </button>
  );
});

export default IconActionButton;