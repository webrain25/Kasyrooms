import { useQuery } from "@tanstack/react-query";

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
  {
    id: "vip",
    label: "VIP Models",
    icon: "fas fa-crown",
    iconClass: "text-gold-primary"
  },
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
  const { data: onlineCount } = useQuery<{ count: number }>({
    queryKey: ["/api/stats/online-count"],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <section className="bg-background border-b border-border sticky top-16 z-40 backdrop-blur-sm" data-testid="category-filters">
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-2 py-4 overflow-x-auto no-scrollbar">
          {filters.map((filter) => (
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
              <span>{filter.label}</span>
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
