// src/context/SearchContext.jsx
import { createContext, useContext, useState, useCallback, useRef } from "react";

const SearchContext = createContext(null);

export const SearchProvider = ({ children }) => {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState({ cursos: [], tareas: [], eventos: [], foros: [], usuarios: [] });
  const [isOpen,  setIsOpen]  = useState(false);

  // useRef keeps the same Map across re-renders; plain `new Map()` would be discarded on each render
  const handlersRef = useRef(new Map());

  const registerSearchHandler = useCallback((key, handler) => {
    handlersRef.current.set(key, handler);
    return () => handlersRef.current.delete(key);
  }, []);

  const performSearch = useCallback((q) => {
    if (!q || q.trim().length < 2) {
      setResults({ cursos: [], tareas: [], eventos: [], foros: [], usuarios: [] });
      return;
    }

    const newResults = { cursos: [], tareas: [], eventos: [], foros: [], usuarios: [] };

    for (const [, handler] of handlersRef.current.entries()) {
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
  if (!context) throw new Error("useSearch debe estar dentro de SearchProvider");
  return context;
};
