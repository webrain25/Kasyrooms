import { useEffect, useRef, useState, useLayoutEffect } from "react";
import { useSearch } from "@/lib/searchContext";
import { useAuth } from "@/lib/authContext";
import { useFavorites } from "@/lib/favoritesContext";
// Use logo from public root so it can be swapped without rebuilding
import { useI18n } from "@/lib/i18n";
import type { Model } from "@shared/schema";
import { BRAND } from "@/lib/brand";
import { useQuery } from "@tanstack/react-query";
import MessagesHistoryButton from "./messages-history";
import { useQuery as useRQ } from "@tanstack/react-query";

export default function Header() {
  const { t } = useI18n();
  const headerRef = useRef<HTMLElement | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const { searchTerm, setSearchTerm, setIsSearchActive } = useSearch();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { favorites } = useFavorites();
  // Fetch models to validate favorites against actual existing IDs
  const { data: allModels = [] } = useQuery<Model[]>({
    queryKey: ["models", "for-favorites-badge"],
    queryFn: async (): Promise<Model[]> => {
      const res = await fetch("/api/models");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated // don't fetch when logged out
  });
  const validIds = new Set(allModels.map((m) => m.id));
  const validFavoritesCount = favorites.filter((id) => validIds.has(id)).length;

  // Wallet balance for authenticated users (shared or local)
  const { data: walletInfo } = useRQ<{ balance: number } | null>({
    queryKey: ["/api/wallet/balance", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const url = `/api/wallet/balance?userId=${encodeURIComponent(user.id)}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user?.id,
    refetchInterval: 20000,
  });

  // For models, show a small "Live" badge when online
  const { data: modelMe } = useQuery<Model | null>({
    queryKey: ['model-me-status', user?.id],
    queryFn: async (): Promise<Model | null> => {
      if (!user?.id || user?.role !== 'model') return null;
      const res = await fetch(`/api/models/${user.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user?.id && user?.role === 'model',
    refetchInterval: 15000
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsSearchActive(value.length > 0);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchActive(searchTerm.length > 0);
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  useLayoutEffect(() => {
    // Preload last known header height to reduce first-paint layout shift
    const cached = sessionStorage.getItem('appHeaderH');
    if (cached) {
      document.documentElement.style.setProperty('--app-header-h', `${cached}px`);
    }
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const setVar = () => {
      const h = el.getBoundingClientRect().height;
      const hp = Math.ceil(h);
      document.documentElement.style.setProperty('--app-header-h', `${hp}px`);
      sessionStorage.setItem('appHeaderH', String(hp));
    };
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    window.addEventListener('orientationchange', setVar);
    window.addEventListener('resize', setVar);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', setVar);
      window.removeEventListener('resize', setVar);
    };
  }, []);

  return (
    <header ref={headerRef} className="bg-transparent">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3">
            <a href="/" className="flex items-center space-x-2">
              <img
                src={BRAND.LOGO_SVG}
                alt={BRAND.ALT}
                width={110}
                height={38}
                className="bg-transparent h-auto w-auto select-none [filter:drop-shadow(0_0_1px_rgba(0,0,0,0.5))]"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </a>
          </div>
          {isAuthenticated && (
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center bg-card rounded-lg px-4 py-2 w-64">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-muted mr-2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-foreground placeholder-muted w-full disabled:opacity-60"
              // authenticated-only render, no need to disable
            />
          </form>
          )}
          <div className="flex items-center space-x-2">
            {/* Hide favorites link until auth resolved to avoid flash when logged out */}
            {(!isLoading && isAuthenticated) && favorites && (
              <a href="/favorites" className="px-3 py-2 rounded-lg hover:bg-accent relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-gold-primary mr-1 inline-block align-middle"
                  aria-hidden="true"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span className="hidden md:inline">{t('favorites')}</span>
                {validFavoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold-primary text-background text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {validFavoritesCount > 99 ? '99+' : validFavoritesCount}
                  </span>
                )}
              </a>
            )}
            {(!isLoading && isAuthenticated) && (
              <MessagesHistoryButton />
            )}
            {!isAuthenticated && !isLoading && (
              <div className="flex items-center space-x-2">
                <a href="/login" className="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-accent transition-colors">
                  {t('login')}
                </a>
                <a href="/register" className="px-4 py-2 text-sm font-medium rounded-lg bg-gold-primary text-background hover:opacity-90 transition-opacity">
                  {t('signup')}
                </a>
              </div>
            )}
            {isAuthenticated && (
              <>
                <span className="text-sm text-muted">{t('welcome')}, {user?.username}</span>
                {walletInfo && (
                  <span className="px-2 py-1 text-xs rounded-md bg-card border border-border ml-1">
                    €{Number(walletInfo.balance ?? 0).toFixed(2)}
                  </span>
                )}
                {/* Role shortcuts */}
                {user?.role === 'model' && (
                  <a href="/dashboard/model" className="px-3 py-2 rounded-lg hover:bg-accent text-sm inline-flex items-center gap-2">
                    Dashboard
                    {modelMe?.isOnline && (
                      <span className="px-2 py-0.5 text-[11px] leading-none rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">LIVE</span>
                    )}
                  </a>
                )}
                {user?.role === 'admin' && (
                  <a href="/admin" className="px-3 py-2 rounded-lg hover:bg-accent text-sm">Admin</a>
                )}
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg bg-transparent border border-border hover:bg-accent"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 inline-block align-middle mr-2"
                    aria-hidden="true"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  {t('logout')}
                </button>
                {/* Language selector removed from header as per request */}
                </>
              )}
            {/* Guest language selector removed; handled in footer now */}
            {isAuthenticated && (
            <button type="button" aria-label="Toggle search" className="md:hidden p-3 min-h-[44px] min-w-[44px]" onClick={()=>setIsSearchVisible(v=>!v)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-muted"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            )}
          </div>
        </div>
        {isAuthenticated && isSearchVisible && (
          <form onSubmit={handleSearchSubmit} className="md:hidden mt-2 flex items-center bg-card rounded-lg px-3 py-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 text-muted mr-2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-foreground placeholder-muted w-full disabled:opacity-60"
              // authenticated-only render, no need to disable
            />
          </form>
        )}
      </div>
    </header>
  );
}
