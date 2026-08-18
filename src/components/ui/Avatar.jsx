// src/components/ui/Avatar.jsx
import { useState, useEffect } from "react";
import fallbackImg from "@/assets/icons/logo.svg";

const SIZES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
};

export default function Avatar({
  src,
  alt = "Usuario",
  size = "md",
  initials,
  fallback = fallbackImg,
  className = "",
}) {
  const [imgSrc, setImgSrc] = useState(src || null);

  useEffect(() => {
    setImgSrc(src || null);
  }, [src]);

  return (
    <div
      className={[
        "relative inline-flex items-center justify-center",
        "rounded-full overflow-hidden shrink-0",
        "border transition-shadow duration-200",
        SIZES[size] ?? SIZES.md,
        className,
      ].join(" ")}
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={alt}
          // object-contain en vez de object-cover: los avatares vienen en
          // proporciones distintas (altos, anchos, ya circulares). "cover"
          // recorta cabezas/bordes para llenar el círculo; "contain" siempre
          // muestra la imagen completa, centrada, con un pequeño respiro.
          className="w-full h-full object-contain p-[10%]"
          onError={() => setImgSrc(null)}
        />
      ) : initials ? (
        <span
          className="font-semibold leading-none select-none"
          aria-label={alt}
          style={{ color: "var(--color-primary)" }}
        >
          {initials}
        </span>
      ) : (
        <img
          src={fallback}
          alt={alt}
          className="w-2/3 h-2/3 object-contain opacity-70"
        />
      )}
    </div>
  );
}