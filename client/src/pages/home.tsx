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

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("online");
  const { searchTerm, isSearchActive } = useSearch();
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { favorites } = useFavorites();

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
        title: `Search Results`,
        icon: "fas fa-search",
        iconClass: "text-gold-primary",
        subtitle: `Results for "${searchTerm}"`,
        filter: {},
        showRank: false,
        testId: "section-search-results"
      };
    }

    switch (activeFilter) {
      case "online":
        return {
          title: "Online Now",
          icon: "fas fa-circle",
          iconClass: "text-online text-xs status-online",
          subtitle: "Models currently live and available",
          filter: { isOnline: true },
          showRank: false,
          testId: "section-online-models"
        };
      case "top":
        return {
          title: "Top Rated Models",
          icon: "fas fa-star",
          iconClass: "text-gold-primary",
          subtitle: "The best performers on our platform",
          filter: { sortBy: 'rating' as const },
          showRank: true,
          testId: "section-top-models"
        };
      
      case "new":
        return {
          title: "New Models",
          icon: "fas fa-sparkles",
          iconClass: "text-gold-primary",
          subtitle: "Fresh faces joining our community",
          filter: { isNew: true },
          showRank: false,
          testId: "section-new-models"
        };
      case "trending":
        return {
          title: "Trending Now",
          icon: "fas fa-fire",
          iconClass: "text-destructive",
          subtitle: "Most popular models right now",
          filter: { isOnline: true },
          showRank: false,
          testId: "section-trending-models"
        };
      case "favorites":
        return {
          title: "Your Favorites",
          icon: "fas fa-heart",
          iconClass: "text-destructive",
          subtitle: "Your bookmarked models",
          filter: { isOnline: true },
          showRank: false,
          testId: "section-favorites-models"
        };
      default:
        return {
          title: "All Models",
          icon: "fas fa-users",
          iconClass: "",
          subtitle: "Browse all available models",
          filter: {},
          showRank: false,
          testId: "section-all-models"
        };
    }
  };

  const config = getFilterConfig();

  // Build ordered ids for home according to spec (favorites first by status, then others)
  const favsCsv = favorites.join(",");
  const { data: homeGroups } = useQuery<{ favorites: any; others: any }>({
    queryKey: ["/api/models/home", favsCsv],
    queryFn: async () => {
      const url = favsCsv ? `/api/models/home?favs=${encodeURIComponent(favsCsv)}` : "/api/models/home";
      const res = await fetch(url);
      if (!res.ok) return { favorites: { online: [], busy: [], offline: [] }, others: { online: [], busy: [], offline: [] } };
      return res.json();
    },
    staleTime: 5000,
    refetchInterval: 10000
  });
  const orderedIds: string[] | undefined = (() => {
    if (!homeGroups) return undefined;
    const pick = (a: any[]) => a.map((x: any) => String(x.id));
    return [
      ...pick(homeGroups.favorites?.online || []),
      ...pick(homeGroups.favorites?.busy || []),
      ...pick(homeGroups.favorites?.offline || []),
      ...pick(homeGroups.others?.online || []),
      ...pick(homeGroups.others?.busy || []),
      ...pick(homeGroups.others?.offline || []),
    ];
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
          <ModelGrid filter={config.filter} showRank={config.showRank} minimal />
  <ModelGrid filter={config.filter} showRank={config.showRank} minimal orderedIds={orderedIds} refetchIntervalMs={10000} />
        </div>
      </section>

  {/* VIP promotion removed */}
      <Footer />
    </div>
  );
}
