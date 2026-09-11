import { createContext, useContext, useState, useCallback, useRef, useMemo } from "react";

const SearchContext = createContext(null);

const EMPTY_RESULTS = { cursos: [], tareas: [], eventos: [], foros: [], usuarios: [] };

export const SearchProvider = ({ children }) => {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState(EMPTY_RESULTS);
  const [isOpen,  setIsOpen]  = useState(false);

  // useRef mantiene el mismo Map entre re-renders
  const handlersRef   = useRef(new Map());
  const searchTimer   = useRef(null);

  const registerSearchHandler = useCallback((key, handler) => {
    handlersRef.current.set(key, handler);
    return () => handlersRef.current.delete(key);
  }, []);

  const performSearch = useCallback((q) => {
    if (!q || q.trim().length < 2) {
      setResults(EMPTY_RESULTS);
      return;
    }

    const newResults = { ...EMPTY_RESULTS };

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
    clearTimeout(searchTimer.current);
    if (q.trim().length === 0) {
      setResults(EMPTY_RESULTS);
    } else {
      searchTimer.current = setTimeout(() => performSearch(q), 200);
    }
  }, [performSearch]);

  const clearSearch = useCallback(() => {
    clearTimeout(searchTimer.current);
    setQuery("");
    setResults(EMPTY_RESULTS);
    setIsOpen(false);
  }, []);

  const value = useMemo(() => ({
    query,
    results,
    isOpen,
    setIsOpen,
    handleSearch,
    clearSearch,
    registerSearchHandler,
  }), [query, results, isOpen, handleSearch, clearSearch, registerSearchHandler]);

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
