import { memo, useMemo, useState } from "react";
import useUserStore from "@/store/useUserStore";

const PALETTE = [
  "#0C6AC4",
  "#6366F1",
  "#16A34A",
  "#D97706",
  "#7C3AED",
  "#0284C7",
  "#EC4899",
  "#F43F5E",
];

const ROLE_BORDER = {
  docente:    "#0C6AC4",
  estudiante: "#16A34A",
  familia:    "#D97706",
  padre:      "#D97706",
  admin:      "#7C3AED",
  administrador: "#7C3AED",
};

function hash(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pickColor(user) {
  const key = `${user?.nombre ?? ""}${user?.apellido ?? ""}`;
  return PALETTE[hash(key) % PALETTE.length];
}

function initials(user) {
  const n = user?.nombre?.[0] || "";
  const a = user?.apellido?.[0] || "";
  return (n + a).toUpperCase() || "?";
}

// Wrapped in React.memo to prevent re-renders in large lists.
const UserAvatar = memo(function UserAvatar({
  user,
  size = 36,
  title,
  showStatus = false,
  // If provided, overrides the store-based online status
  status,
  style,
  // When provided the avatar becomes an interactive element (e.g. navigate to profile)
  onClick,
}) {
  const [error, setError] = useState(false);

  // Read from global store only when showStatus is requested
  const storeOnline = useUserStore((s) =>
    showStatus && user?._id ? s.onlineUsers[user._id] : undefined
  );

  const hasPhoto = !!user?.fotoPerfilUrl && !error;
  const bg = useMemo(() => pickColor(user), [user]);
  const text = useMemo(() => initials(user), [user]);

  const tooltip =
    title?.trim() ||
    `${user?.nombre ?? ""} ${user?.apellido ?? ""}`.trim() ||
    "Usuario";

  const borderColor = ROLE_BORDER[user?.rol] || "transparent";

  // Explicit prop takes precedence; otherwise fall back to store value
  const resolvedStatus = status ?? (storeOnline ? "online" : "offline");

  return (
    <div
      title={tooltip}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(e); } } : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        position: "relative",
        flexShrink: 0,
        overflow: "hidden",
        background: hasPhoto ? "#e5e7eb" : bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `2px solid ${borderColor}`,
        transition: "transform 0.15s ease",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {hasPhoto ? (
        <img
          src={user.fotoPerfilUrl}
          alt={tooltip}
          onError={() => setError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span style={{ fontWeight: 700, color: "white", fontSize: size * 0.35 }}>
          {text}
        </span>
      )}

      {/* ONLINE STATUS dot */}
      {showStatus && (
        <span
          style={{
            position: "absolute",
            bottom: 2,
            right: 2,
            width: size * 0.28,
            height: size * 0.28,
            borderRadius: "50%",
            background: resolvedStatus === "online" ? "#22c55e" : "#9ca3af",
            border: "2px solid white",
          }}
        />
      )}
    </div>
  );
});

export default UserAvatar;
