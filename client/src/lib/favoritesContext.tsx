import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useAuth } from "@/lib/authContext";

type FavoritesContextType = {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  clearFavorites: () => void;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const { user } = useAuth();

  const cleanList = (input: unknown): string[] => {
    if (!Array.isArray(input)) return [];
    return Array.from(
      new Set(
        input
          .filter((x) => typeof x === "string")
          .map((x) => (x as string).trim())
          // drop empty, 'undefined', and 'null' sentinel values
          .filter((x) => x.length > 0 && x !== 'undefined' && x !== 'null')
      )
    );
  };

  // Load favorites when auth user changes; migrate legacy key if needed
  useEffect(() => {
    try {
      if (user?.id) {
        const key = `favorites:${user.id}`;
        const savedForUser = localStorage.getItem(key);
        if (savedForUser) {
          setFavorites(cleanList(JSON.parse(savedForUser)));
        } else {
          // Migrate from legacy global key if present
          const legacy = localStorage.getItem("favorites");
          if (legacy) {
            const cleaned = cleanList(JSON.parse(legacy));
            setFavorites(cleaned);
            localStorage.setItem(key, JSON.stringify(cleaned));
            try { localStorage.removeItem("favorites"); } catch {}
          } else {
            setFavorites([]);
          }
        }
      } else {
        // No authenticated user -> keep in-memory empty
        setFavorites([]);
      }
    } catch {
      setFavorites([]);
    }
  }, [user?.id]);

  // Persist favorites only for authenticated users
  useEffect(() => {
    try {
      if (user?.id) {
        const key = `favorites:${user.id}`;
        localStorage.setItem(key, JSON.stringify(favorites));
      }
    } catch {}
  }, [favorites, user?.id]);

  const toggleFavorite = (id: string) => {
    const safeId = (id ?? "").toString().trim();
    if (!safeId || safeId === 'undefined' || safeId === 'null') return;
    setFavorites((prev) => (prev.includes(safeId) ? prev.filter((x) => x !== safeId) : [...prev, safeId]));
  };

  const isFavorite = useMemo(() => {
    return (id: string) => favorites.includes(id);
  }, [favorites]);

  const clearFavorites = () => setFavorites([]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
