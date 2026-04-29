// src/context/SearchContext.jsx
import { createContext, useContext, useState, useCallback } from "react";

const SearchContext = createContext(null);

export const SearchProvider = ({ children }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ cursos: [], tareas: [], eventos: [], foros: [], usuarios: [] });
  const [isOpen, setIsOpen] = useState(false);
  
  // Map para registrar búsqueda desde cada página
  const searchHandlers = new Map();

  const registerSearchHandler = useCallback((key, handler) => {
    searchHandlers.set(key, handler);
    return () => searchHandlers.delete(key);
  }, []);

  const performSearch = useCallback((q) => {
    if (!q || q.trim().length < 2) {
      setResults({ cursos: [], tareas: [], eventos: [], foros: [], usuarios: [] });
      return;
    }

    const newResults = { cursos: [], tareas: [], eventos: [], foros: [], usuarios: [] };

    // Ejecutar búsqueda en cada handler registrado
    for (const [key, handler] of searchHandlers.entries()) {
      const categoryResults = handler(q);
      if (categoryResults && typeof categoryResults === "object") {
        Object.assign(newResults, categoryResults);
      }
    }

    setResults(newResults);
  }, []);

  const handleSearch = useCallback((q) => {
    setQuery(q);
    if (q.trim().length === 0) {
      setResults({ cursos: [], tareas: [], eventos: [], foros: [], usuarios: [] });
    } else {
      performSearch(q);
    }
  }, [performSearch]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults({ cursos: [], tareas: [], eventos: [], foros: [], usuarios: [] });
    setIsOpen(false);
  }, []);

  const value = {
    query,
    results,
    isOpen,
    setIsOpen,
    handleSearch,
    clearSearch,
    registerSearchHandler,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch debe estar dentro de SearchProvider");
  }
  return context;
};
