import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/authContext";
import { useEffect, useRef } from "react";

interface CategoryFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

const filters = [
  {
    id: "online",
    label: "Online Now",
    icon: "fas fa-circle",
    iconClass: "text-xs status-online",
    endpoint: "/api/stats/online-count"
  },
  {
    id: "top",
    label: "Top Rated",
    icon: "fas fa-star",
    iconClass: "text-gold-primary"
  },
  // VIP removed
  {
    id: "new",
    label: "New Models",
    icon: "fas fa-sparkles",
    iconClass: ""
  },
  {
    id: "trending",
    label: "Trending",
    icon: "fas fa-fire",
    iconClass: ""
  },
  {
    id: "favorites",
    label: "Favorites",
    icon: "fas fa-heart",
    iconClass: ""
  }
];

export default function CategoryFilters({ activeFilter, onFilterChange }: CategoryFiltersProps) {
  const { t } = useI18n();
  const { isAuthenticated, isLoading } = useAuth();
  const sectionRef = useRef<HTMLElement | null>(null);
  const { data: onlineCount } = useQuery<{ count: number }>({
    queryKey: ["/api/stats/online-count"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Measure filters bar height and expose CSS var for anchor offsets
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const setVar = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--filters-h', `${h}px`);
      // Cache to reduce first-paint layout shift
      try { sessionStorage.setItem('filtersH', String(h)); } catch {}
    };
    // Preload from cache if available
    try {
      const cached = sessionStorage.getItem('filtersH');
      if (cached) {
        document.documentElement.style.setProperty('--filters-h', `${cached}px`);
      }
    } catch {}
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
    <section
      ref={sectionRef}
      className="bg-background border-b border-border"
      data-testid="category-filters"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-2 py-4 overflow-x-auto no-scrollbar">
          {filters
            // Hide favorites until auth loaded to prevent flash for logged-out users
            .filter(f => !!f.id && (f.id === 'favorites' ? (!isLoading && isAuthenticated) : true))
            .map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`category-filter px-6 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap flex items-center space-x-2 ${
                activeFilter === filter.id
                  ? 'active'
                  : 'bg-card hover:bg-card-hover text-foreground'
              }`}
              data-testid={`filter-${filter.id}`}
            >
              <i className={`${filter.icon} ${filter.iconClass}`}></i>
              <span>{t(`filters.${filter.id}`)}</span>
              {filter.id === "online" && onlineCount && (
                <span className="bg-background/30 px-2 py-0.5 rounded-full text-xs" data-testid="online-count">
                  {onlineCount.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
