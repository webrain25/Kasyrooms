import Header from "@/components/header";
import HeroCarousel from "@/components/hero-carousel";
import CategoryFilters from "@/components/category-filters";
import ModelGrid from "@/components/model-grid";
import VipPromotion from "@/components/vip-promotion";
import Footer from "@/components/footer";
import { useState } from "react";

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("online");

  const getFilterConfig = () => {
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
      case "vip":
        return {
          title: "VIP Models",
          icon: "fas fa-crown",
          iconClass: "text-gold-primary",
          subtitle: "Exclusive premium content creators",
          filter: { isVip: true },
          showRank: false,
          testId: "section-vip-models"
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroCarousel />
      <CategoryFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      
      {/* Main Filtered Section */}
      <section className="py-12 bg-background" data-testid={config.testId}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center" data-testid={`heading-${activeFilter}-models`}>
                <i className={`${config.icon} ${config.iconClass} mr-3`}></i>
                {config.title}
              </h2>
              <p className="text-muted">{config.subtitle}</p>
            </div>
            <a href="#" className="flex items-center space-x-2 text-gold-primary hover:text-gold-accent font-semibold" data-testid={`link-view-all-${activeFilter}`}>
              <span>View all</span>
              <i className="fas fa-arrow-right"></i>
            </a>
          </div>
          <ModelGrid filter={config.filter} showRank={config.showRank} />
        </div>
      </section>

      <VipPromotion />
      <Footer />
    </div>
  );
}
