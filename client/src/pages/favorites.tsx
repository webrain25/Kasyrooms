import Header from "@/components/header";
import Footer from "@/components/footer";
import { Loader2 } from "lucide-react";
import { useFavorites } from "@/lib/favoritesContext";
import { useQuery } from "@tanstack/react-query";
import ModelCard from "@/components/model-card";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/authContext";
import { useEffect } from "react";
import { useLocation } from "wouter";


export default function Favorites() {
  const { favorites } = useFavorites();
  const { t } = useI18n();
  const { isAuthenticated, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  // Redirect if not authenticated (even while loading, block render)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const { data: models = [] } = useQuery({
    queryKey: ["/api/models"],
    queryFn: async () => {
      const res = await fetch("/api/models");
      return res.json();
    }
  });

  const favModels = models.filter((m: any) => favorites.includes(m.id));

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="animate-spin w-12 h-12 text-primary mb-4" />
      <span className="text-muted">{t('common.loading.auth')}</span>
    </div>
  );
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{t('favorites.title')}</h1>
        {favModels.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favModels.map((m: any) => (
              <ModelCard key={m.id} model={m} />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">496</div>
              <h3 className="text-xl font-semibold mb-2">{t('favorites.empty.title')}</h3>
              <p className="text-muted">{t('favorites.empty.subtitle')}</p>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
