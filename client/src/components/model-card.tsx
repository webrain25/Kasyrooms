import { Model } from "@shared/schema";
import { Link } from "wouter";
import { useFavorites } from "@/lib/favoritesContext";
import { useState } from "react";
import VideoChatModal from "./video-chat-modal";
import { useI18n } from "@/lib/i18n";

interface ModelCardProps {
  model: Model;
  showRank?: boolean;
  rank?: number;
  minimal?: boolean;
}

export default function ModelCard({ model, showRank = false, rank, minimal = false }: ModelCardProps) {
  const [isVideoChatOpen, setIsVideoChatOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useI18n();
  const isOffline = !model.isOnline;
  const statusColor = model.isOnline ? (model.isBusy ? 'bg-red-500 status-busy' : 'bg-online status-online') : 'bg-yellow-400 status-offline';
  
  const formatRating = (rating: number) => {
    return (rating / 10).toFixed(1);
  };

  const handleStartChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsVideoChatOpen(true);
  };

  return (
    <>
      <Link href={isOffline ? '#'
        : `/model/${model.id}`}
        onClick={(e) => { if (isOffline) { e.preventDefault(); e.stopPropagation(); } }}>
      <div
        className={`model-card bg-card rounded-card overflow-hidden group cursor-pointer ${model.isOnline ? '' : 'model-offline'}`}
        data-testid={`model-card-${model.id}`}
      >
      <div className="relative aspect-[3/4]">
        <img
          src={model.profileImage}
          alt={`Model ${model.name}`}
          className="w-full h-full object-cover"
          data-testid={`model-image-${model.id}`}
        />
        {/* minimal mode has no additional badges here */}
        
        {/* New Badge - Right */}
        {model.isNew && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-online rounded-md" data-testid={`new-badge-${model.id}`}>
            <span className="text-background text-xs font-bold">NEW</span>
          </div>
        )}
        
        {/* Rank Badge */}
        {showRank && rank && (
          <div className={`absolute top-12 right-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
            rank === 1 
              ? 'bg-gold-primary text-background border-gold-primary' 
              : 'bg-card text-gold-primary border-gold-primary'
          }`} data-testid={`rank-badge-${model.id}`}>
            {rank}
          </div>
        )}
        
        {/* Status Indicator */}
        {!showRank && !model.isNew && (
          <div className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-background ${statusColor}`} data-testid={`status-${model.id}`}></div>
        )}
        
        {/* Status Indicator when NEW badge is present */}
        {!showRank && model.isNew && (
          <div className={`absolute top-12 right-2 w-3 h-3 rounded-full border-2 border-background ${statusColor}`} data-testid={`status-${model.id}`}></div>
        )}
        
        {/* Favorite button - always visible (even in minimal), so offline models can still be favorited */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(model.id); }}
          className={`absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center border-2 ${isFavorite(model.id) ? 'bg-gold-primary text-background border-gold-primary' : 'bg-card/80 backdrop-blur text-foreground border-border'} hover:scale-105 transition-transform`}
          aria-label="Toggle favorite"
          data-testid={`favorite-${model.id}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

  {/* Hover Overlay; hidden in minimal mode */}
  {!minimal && (
  <div className="model-overlay absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent flex flex-col justify-end p-4" data-testid={`overlay-${model.id}`}>
          <div className="mb-3">
            <div className="flex items-center space-x-2 text-xs text-muted mb-2">
              <span data-testid={`model-age-${model.id}`}>{model.age}</span>
              <span data-testid={`model-country-${model.id}`}>{model.country}</span>
              <span data-testid={`model-languages-${model.id}`}>{model.languages.join(", ")}</span>
            </div>
            <p className="text-xs text-muted line-clamp-2" data-testid={`model-specialties-${model.id}`}>
              {model.specialties.join(", ")}
            </p>
          </div>
          <button
            onClick={handleStartChat}
            className="w-full py-2.5 btn-gold text-background rounded-lg font-semibold text-sm"
            data-testid={`button-start-chat-${model.id}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            {t('modelCard.startChat')}
          </button>
        </div>
        )}
      </div>
      
      {/* Card Footer; hidden in minimal mode */}
      {!minimal && (
      <div className="p-3">
        <h3 className="font-semibold text-foreground mb-1" data-testid={`model-name-${model.id}`}>
          {model.name}
        </h3>
        <div className="flex items-center justify-between text-xs">
          {showRank ? (
            <span className={`${model.isOnline ? 'text-online' : 'text-offline'}`} data-testid={`model-status-text-${model.id}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 mr-1 rounded-full"><circle cx="12" cy="12" r="12"/></svg>
              {model.isOnline ? t('modelCard.online') : t('modelCard.offline')}
            </span>
          ) : (
            <span className="text-muted" data-testid={`model-viewers-${model.id}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 mr-1"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {model.viewerCount} {t('modelCard.watching')}
            </span>
          )}
          <span className="text-gold-primary font-semibold" data-testid={`model-rating-${model.id}`}>
            ★ {model.rating ? formatRating(model.rating) : t('modelCard.new')}
          </span>
        </div>
      </div>
      )}
    </div>
    </Link>
    
    <VideoChatModal 
      isOpen={isVideoChatOpen}
      onClose={() => setIsVideoChatOpen(false)}
      modelName={model.name}
      isModelOnline={!!model.isOnline}
      modelId={model.id}
    />
  </>
  );
}
