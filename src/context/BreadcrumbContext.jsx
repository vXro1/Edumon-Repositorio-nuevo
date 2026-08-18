import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const BreadcrumbCtx = createContext(null);

export function BreadcrumbProvider({ children }) {
  const [titles, setTitles] = useState({});

  const setTitle = (pathname, title) => {
    setTitles((prev) => {
      if (prev[pathname] === title) return prev;
      return { ...prev, [pathname]: title };
    });
  };

  return (
    <BreadcrumbCtx.Provider value={{ titles, setTitle }}>
      {children}
    </BreadcrumbCtx.Provider>
  );
}

export const useBreadcrumbContext = () => useContext(BreadcrumbCtx);

/**
 * Hook para que las páginas registren su título dinámico en el breadcrumb.
 * Llamar con el nombre a mostrar (ej. nombre del curso, del foro, etc.).
 */
export function useSetPageTitle(title) {
  const ctx = useBreadcrumbContext();
  const { pathname } = useLocation();

  useEffect(() => {
    if (title && ctx) ctx.setTitle(pathname, title);
  }, [title, pathname]); // eslint-disable-line react-hooks/exhaustive-deps
}
