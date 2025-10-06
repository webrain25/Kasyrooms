import { useQuery } from "@tanstack/react-query";
import ModelCard from "./model-card";
import { Model } from "@shared/schema";

interface ModelGridProps {
  filter?: {
    isOnline?: boolean;
    isVip?: boolean;
    isNew?: boolean;
    sortBy?: 'rating' | 'viewers';
  };
  limit?: number;
  showRank?: boolean;
}

export default function ModelGrid({ filter = {}, limit, showRank = false }: ModelGridProps) {
  const queryParams = new URLSearchParams();
  if (filter.isOnline) queryParams.append('online', 'true');
  if (filter.isVip) queryParams.append('vip', 'true');
  if (filter.isNew) queryParams.append('new', 'true');
  if (filter.sortBy) queryParams.append('sortBy', filter.sortBy);

  const { data: models, isLoading, error } = useQuery<Model[]>({
    queryKey: [`/api/models?${queryParams.toString()}`],
    refetchInterval: 60000, // Refetch every minute for live data
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6" data-testid="model-grid-loading">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-card rounded-card overflow-hidden animate-pulse" data-testid={`model-skeleton-${i}`}>
            <div className="aspect-[3/4] bg-muted"></div>
            <div className="p-3">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="flex justify-between">
                <div className="h-3 bg-muted rounded w-20"></div>
                <div className="h-3 bg-muted rounded w-10"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12" data-testid="model-grid-error">
        <i className="fas fa-exclamation-triangle text-destructive text-4xl mb-4"></i>
        <h3 className="text-xl font-semibold mb-2">Unable to load models</h3>
        <p className="text-muted">Please try again later</p>
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <div className="text-center py-12" data-testid="model-grid-empty">
        <i className="fas fa-user-slash text-muted text-4xl mb-4"></i>
        <h3 className="text-xl font-semibold mb-2">No models found</h3>
        <p className="text-muted">Try adjusting your filters</p>
      </div>
    );
  }

  const displayedModels = limit ? models.slice(0, limit) : models;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6" data-testid="model-grid">
      {displayedModels.map((model, index) => (
        <ModelCard
          key={model.id}
          model={model}
          showRank={showRank}
          rank={showRank ? index + 1 : undefined}
        />
      ))}
    </div>
  );
}
