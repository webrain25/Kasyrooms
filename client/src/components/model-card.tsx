import { Model } from "@shared/schema";

interface ModelCardProps {
  model: Model;
  showRank?: boolean;
  rank?: number;
}

export default function ModelCard({ model, showRank = false, rank }: ModelCardProps) {
  const formatRating = (rating: number) => {
    return (rating / 10).toFixed(1);
  };

  const handleStartChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement chat functionality
    console.log(`Starting chat with ${model.name}`);
  };

  const handleCardClick = () => {
    // TODO: Navigate to model profile
    console.log(`Navigate to profile: ${model.name}`);
  };

  return (
    <div
      className="model-card bg-card rounded-card overflow-hidden group"
      onClick={handleCardClick}
      data-testid={`model-card-${model.id}`}
    >
      <div className="relative aspect-[3/4]">
        <img
          src={model.profileImage}
          alt={`Model ${model.name}`}
          className="w-full h-full object-cover"
          data-testid={`model-image-${model.id}`}
        />
        
        {/* VIP Badge */}
        {model.isVip && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-gold-primary to-gold-accent rounded-md flex items-center space-x-1" data-testid={`vip-badge-${model.id}`}>
            <i className="fas fa-crown text-background text-xs"></i>
            <span className="text-background text-xs font-bold">VIP</span>
          </div>
        )}
        
        {/* New Badge */}
        {model.isNew && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-online rounded-md" data-testid={`new-badge-${model.id}`}>
            <span className="text-background text-xs font-bold">NEW</span>
          </div>
        )}
        
        {/* Rank Badge */}
        {showRank && rank && (
          <div className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
            rank === 1 
              ? 'bg-gold-primary text-background border-gold-primary' 
              : 'bg-card text-gold-primary border-gold-primary'
          }`} data-testid={`rank-badge-${model.id}`}>
            {rank}
          </div>
        )}
        
        {/* Status Indicator */}
        {!showRank && (
          <div className={`absolute top-2 right-2 w-3 h-3 rounded-full border-2 border-background ${
            model.isOnline ? 'bg-online status-online' : 'bg-offline'
          }`} data-testid={`status-${model.id}`}></div>
        )}
        
        {/* Hover Overlay */}
        <div className="model-overlay absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent flex flex-col justify-end p-4" data-testid={`overlay-${model.id}`}>
          <div className="mb-3">
            <div className="flex items-center space-x-2 text-xs text-muted mb-2">
              <span data-testid={`model-age-${model.id}`}>
                <i className="fas fa-user mr-1"></i>{model.age}
              </span>
              <span data-testid={`model-country-${model.id}`}>
                <i className="fas fa-map-marker-alt mr-1"></i>{model.country}
              </span>
              <span data-testid={`model-languages-${model.id}`}>
                <i className="fas fa-language mr-1"></i>{model.languages.join(", ")}
              </span>
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
            <i className="fas fa-video mr-2"></i>
            Start Chat
          </button>
        </div>
      </div>
      
      {/* Card Footer */}
      <div className="p-3">
        <h3 className="font-semibold text-foreground mb-1" data-testid={`model-name-${model.id}`}>
          {model.name}
        </h3>
        <div className="flex items-center justify-between text-xs">
          {showRank ? (
            <span className={`${model.isOnline ? 'text-online' : 'text-offline'}`} data-testid={`model-status-text-${model.id}`}>
              <i className="fas fa-circle mr-1"></i>
              {model.isOnline ? 'Online' : 'Offline'}
            </span>
          ) : (
            <span className="text-muted" data-testid={`model-viewers-${model.id}`}>
              <i className="fas fa-eye mr-1"></i>
              {model.viewerCount} watching
            </span>
          )}
          <span className="text-gold-primary font-semibold" data-testid={`model-rating-${model.id}`}>
            ★ {model.rating ? formatRating(model.rating) : 'New'}
          </span>
        </div>
      </div>
    </div>
  );
}
