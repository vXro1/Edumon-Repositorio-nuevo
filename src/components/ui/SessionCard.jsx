// src/components/ui/SessionCard.jsx
import { Monitor, Smartphone, Tablet, Globe, Clock, MapPin } from "lucide-react";

const DEVICE_ICONS = {
  mobile:  Smartphone,
  tablet:  Tablet,
  desktop: Monitor,
};

const formatDate = (iso) => {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

const getDeviceType = (ua = "") => {
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua))           return "tablet";
  return "desktop";
};

const DeviceIcon = ({ ua }) => {
  const type = getDeviceType(ua);
  const Icon = DEVICE_ICONS[type];
  return <Icon size={18} />;
};

export const SessionCard = ({ sesion, isCurrent = false }) => {
  const {
    ip,
    userAgent,
    fechaInicio,
    ultimaActividad,
    pais,
    ciudad,
  } = sesion ?? {};

  const deviceType = getDeviceType(userAgent);

  return (
    <div
      style={{
        background:    "var(--color-surface, #fff)",
        border:        isCurrent
          ? "1.5px solid var(--color-primary, #8C38F0)"
          : "1px solid var(--color-border, #e5e7eb)",
        borderRadius:  14,
        padding:       "16px 18px",
        display:       "flex",
        alignItems:    "center",
        gap:           14,
        transition:    "box-shadow 0.2s, transform 0.2s",
        cursor:        "default",
        position:      "relative",
        overflow:      "hidden",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow  = "0 4px 20px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform  = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow  = "";
        e.currentTarget.style.transform  = "";
      }}
    >
      {/* Device icon badge */}
      <div
        style={{
          width:          44,
          height:         44,
          borderRadius:   12,
          background:     isCurrent
            ? "rgba(140,56,240,0.10)"
            : "var(--color-surface-2, #f8f9fa)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          color:          isCurrent
            ? "var(--color-primary, #8C38F0)"
            : "var(--color-text-muted, #6b7280)",
          flexShrink:     0,
        }}
      >
        <DeviceIcon ua={userAgent} />
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span
            style={{
              fontSize:   13.5,
              fontWeight: 600,
              color:      "var(--color-text, #111)",
              textTransform: "capitalize",
            }}
          >
            {deviceType}
          </span>
          {isCurrent && (
            <span
              style={{
                fontSize:   10,
                fontWeight: 700,
                background: "rgba(140,56,240,0.12)",
                color:      "var(--color-primary, #8C38F0)",
                padding:    "2px 8px",
                borderRadius: 9999,
                letterSpacing: "0.04em",
              }}
            >
              ACTUAL
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
          {ip && (
            <span style={{ fontSize: 12, color: "var(--color-text-muted, #6b7280)", display: "flex", alignItems: "center", gap: 4 }}>
              <Globe size={11} />
              {ip}
            </span>
          )}
          {(ciudad || pais) && (
            <span style={{ fontSize: 12, color: "var(--color-text-muted, #6b7280)", display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={11} />
              {[ciudad, pais].filter(Boolean).join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Timestamps */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        {ultimaActividad && (
          <div style={{ fontSize: 12, color: "var(--color-text-muted, #6b7280)", display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginBottom: 2 }}>
            <Clock size={11} />
            {formatDate(ultimaActividad)}
          </div>
        )}
        {fechaInicio && (
          <div style={{ fontSize: 11, color: "var(--color-text-muted, #9ca3af)" }}>
            Inicio: {formatDate(fechaInicio)}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionCard;
