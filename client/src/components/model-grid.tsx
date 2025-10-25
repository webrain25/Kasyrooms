import { useQuery } from "@tanstack/react-query";
import ModelCard from "./model-card";
import { Model } from "@shared/schema";
import { useSearch } from "@/lib/searchContext";
import { useI18n } from "@/lib/i18n";

interface ModelGridProps {
  filter?: {
    isOnline?: boolean;
    isNew?: boolean;
    sortBy?: 'rating' | 'viewers';
  };
  limit?: number;
  showRank?: boolean;
  minimal?: boolean;
  orderedIds?: string[]; // Optional explicit ordering by model id
  refetchIntervalMs?: number; // Optional override for polling interval
}

export default function ModelGrid({ filter = {}, limit, showRank = false, minimal = false, orderedIds, refetchIntervalMs }: ModelGridProps) {
  const { searchTerm, isSearchActive } = useSearch();
  const { t } = useI18n();
  
  const queryParams = new URLSearchParams();
  if (filter.isOnline) queryParams.append('online', 'true');
  if (filter.isNew) queryParams.append('new', 'true');
  if (filter.sortBy) queryParams.append('sortBy', filter.sortBy);
  if (isSearchActive && searchTerm) queryParams.append('search', searchTerm);

  const { data: models, isLoading, error } = useQuery<Model[]>({
    queryKey: [`/api/models?${queryParams.toString()}`],
    refetchInterval: refetchIntervalMs ?? 60000, // Refetch interval (default 1 min)
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
        <h3 className="text-xl font-semibold mb-2">{t('common.errors.loadModels')}</h3>
        <p className="text-muted">{t('common.errors.tryLater')}</p>
      </div>
    );
  }

  if (!models || models.length === 0) {
    return (
      <div className="text-center py-12" data-testid="model-grid-empty">
        <i className="fas fa-user-slash text-muted text-4xl mb-4"></i>
        <h3 className="text-xl font-semibold mb-2">{t('common.noModels.title')}</h3>
        <p className="text-muted">{t('common.noModels.subtitle')}</p>
      </div>
    );
  }

  let displayedModels = limit ? models.slice(0, limit) : models;
  if (orderedIds && orderedIds.length > 0) {
    const idx = new Map<string, number>();
    orderedIds.forEach((id, i) => idx.set(id, i));
    displayedModels = displayedModels
      .filter(m => idx.has(m.id))
      .sort((a, b) => (idx.get(a.id)! - idx.get(b.id)!));
  } else {
    // Default: status sort online > busy > offline
    displayedModels = displayedModels.sort((a, b) => {
      const score = (m: Model) => (m.isOnline ? 2 : 0) + (m.isBusy ? 1 : 0);
      return score(b) - score(a);
    });
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6" data-testid="model-grid">
      {displayedModels.map((model, index) => (
        <ModelCard
          key={model.id}
          model={model}
          showRank={showRank}
          rank={showRank ? index + 1 : undefined}
          minimal={minimal}
        />
      ))}
    </div>
  );
}
