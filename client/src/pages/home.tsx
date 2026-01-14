import Header from "@/components/header";
import HeroCarousel from "@/components/hero-carousel";
import CategoryFilters from "@/components/category-filters";
import ModelGrid from "@/components/model-grid";
import Footer from "@/components/footer";
import { useState, useEffect } from "react";
import { useSearch } from "@/lib/searchContext";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useFavorites } from "@/lib/favoritesContext";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("online");
  const { searchTerm, isSearchActive } = useSearch();
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { favorites } = useFavorites();
  const { t } = useI18n();

  // If user logs out while 'favorites' is active, reset to 'online'
  useEffect(() => {
    if (!isAuthenticated && activeFilter === 'favorites') {
      setActiveFilter('online');
    }
  }, [isAuthenticated, activeFilter]);

  const goToAllModels = () => {
    setLocation("/models");
  };

  const getFilterConfig = () => {
    if (isSearchActive) {
      return {
        title: t('search'),
        icon: "fas fa-search",
        iconClass: "text-gold-primary",
        subtitle: searchTerm ? `"${searchTerm}"` : '',
        filter: {},
        showRank: false,
        testId: "section-search-results"
      };
    }

    switch (activeFilter) {
      case "online":
        return {
          title: t('filter.online'),
          icon: "fas fa-circle",
          iconClass: "text-online text-xs status-online",
          subtitle: t('home.online.subtitle'),
          filter: { isOnline: true },
          showRank: false,
          testId: "section-online-models"
        };
      case "top":
        return {
          title: t('filter.top'),
          icon: "fas fa-star",
          iconClass: "text-gold-primary",
          subtitle: t('home.top.subtitle'),
          filter: { sortBy: 'rating' as const },
          showRank: true,
          testId: "section-top-models"
        };
      
      case "new":
        return {
          title: t('filter.new'),
          icon: "fas fa-sparkles",
          iconClass: "text-gold-primary",
          subtitle: t('home.new.subtitle'),
          filter: { isNew: true },
          showRank: false,
          testId: "section-new-models"
        };
      case "trending":
        return {
          title: t('filter.trending'),
          icon: "fas fa-fire",
          iconClass: "text-destructive",
          subtitle: t('home.trending.subtitle'),
          filter: { isOnline: true },
          showRank: false,
          testId: "section-trending-models"
        };
      case "favorites":
        return {
          title: t('favorites.title'),
          icon: "fas fa-heart",
          iconClass: "text-destructive",
          subtitle: t('home.favorites.subtitle'),
          filter: { isOnline: true },
          showRank: false,
          testId: "section-favorites-models"
        };
      default:
        return {
          title: t('allModels'),
          icon: "fas fa-users",
          iconClass: "",
          subtitle: t('home.all.subtitle'),
          filter: {},
          showRank: false,
          testId: "section-all-models"
        };
    }
  };

  const config = getFilterConfig();

  // Build ordered ids for home according to spec (favorites first by status, then others)
  // Poll full models and compute order locally (works even if /api/models/home is not available)
  const { data: allModels } = useQuery<any[]>({
    queryKey: ["/api/models?home-order"],
    queryFn: async () => {
      const res = await fetch("/api/models");
      return res.ok ? res.json() : [];
    },
    refetchInterval: 10000
  });
  const buildOrders = () => {
    if (!Array.isArray(allModels)) return undefined;
    const favSet = new Set(favorites.map(String));
    const status = (m: any) => ({ online: !!m.isOnline && !m.isBusy, busy: !!m.isBusy, offline: !m.isOnline && !m.isBusy });
    const favs = allModels.filter(m => favSet.has(m.id));
    const others = allModels.filter(m => !favSet.has(m.id));
    const pick = (list: any[], key: 'online'|'busy'|'offline') => list.filter(m => status(m)[key]).map(m => String(m.id));
    const favoritesOnly = [
      ...pick(favs, 'online'), ...pick(favs, 'busy'), ...pick(favs, 'offline'),
    ];
    const fullOrder = [
      ...favoritesOnly,
      ...pick(others, 'online'), ...pick(others, 'busy'), ...pick(others, 'offline'),
    ];
    return { favoritesOnly, fullOrder };
  };
  const orders = buildOrders();
  const orderedIds: string[] | undefined = (() => {
    if (!orders) return undefined;
    if (activeFilter === 'favorites') return orders.favoritesOnly;
    return orders.fullOrder;
  })();

  const handleFilterChange = (id: string) => {
    setActiveFilter(id);
    // Ensure the models section is fully visible below sticky header/filters
    requestAnimationFrame(() => {
      const el = document.getElementById('models');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {!isSearchActive && <HeroCarousel />}
      {!isSearchActive && user?.role === 'model' && (
        <section className="py-6 bg-background/60">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div>
                <div className="text-sm opacity-80">Benvenuta, {user.username}</div>
                <div className="font-semibold">Accedi alla tua Room per andare online, chattare e avviare Private Show</div>
              </div>
              <Button onClick={()=>setLocation('/dashboard/model')} className="btn-gold">Apri la tua Room</Button>
            </div>
          </div>
        </section>
      )}
  {!isSearchActive && <CategoryFilters activeFilter={activeFilter} onFilterChange={handleFilterChange} />}
      
      {/* Main Filtered Section */}
  <section id="models" className="py-12 bg-background" style={{ scrollMarginTop: '16px' }} data-testid={config.testId}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center" data-testid={`heading-${isSearchActive ? 'search' : activeFilter}-models`}>
                <i className={`${config.icon} ${config.iconClass} mr-3`}></i>
                {config.title}
              </h2>
              <p className="text-muted">{config.subtitle}</p>
            </div>
            {!isSearchActive && (
              <button onClick={goToAllModels} className="flex items-center space-x-2 text-gold-primary hover:text-gold-accent font-semibold cursor-pointer" data-testid={`link-view-all-${activeFilter}`}>
                <span>View all</span>
                <i className="fas fa-arrow-right"></i>
              </button>
            )}
          </div>
          <ModelGrid filter={config.filter} showRank={config.showRank} minimal orderedIds={orderedIds} refetchIntervalMs={10000} />
        </div>
      </section>

  {/* VIP promotion removed */}
      <Footer />
    </div>
  );
}
