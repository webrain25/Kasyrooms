import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { buildImageUrl } from "@/lib/utils";

const slides = [
  {
    id: 1,
    title: "Connect with Premium Models",
    subtitle: "Experience exclusive private shows with verified VIP models. Join now and get 100 free credits.",
    image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    badge: "VIP Featured"
  },
  {
    id: 2,
    title: "New Models Every Day",
    subtitle: "Discover fresh faces and exciting personalities joining our premium platform daily.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    badge: "Fresh Arrivals"
  },
  {
    id: 3,
    title: "24/7 Live Entertainment",
    subtitle: "Round-the-clock access to hundreds of beautiful models from around the world.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
    badge: "Always Online"
  }
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [, setLocation] = useLocation();
  const { t } = useI18n();

  const goToLogin = () => {
    setLocation("/login");
  };

  const scrollToModels = () => {
    const modelsSection = document.getElementById('models');
    if (modelsSection) {
      modelsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="relative bg-secondary overflow-hidden" data-testid="hero-carousel">
      <div className="container mx-auto px-4 py-8">
        <div className="relative h-[400px] md:h-[500px] rounded-card overflow-hidden">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-500 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
              style={{
                backgroundImage: `linear-gradient(to right, rgba(26, 29, 41, 0.8), rgba(26, 29, 41, 0.3)), url('${buildImageUrl(slide.image, { preferWebp: true })}')`
              }}
              data-testid={`hero-slide-${index}`}
            >
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-8 md:px-16">
                  <div className="max-w-xl">
                    <div className="inline-flex items-center space-x-2 bg-gold-primary/20 backdrop-blur-sm border border-gold-primary px-4 py-2 rounded-full mb-4">
                      <i className="fas fa-crown text-gold-accent"></i>
                      <span className="text-gold-accent font-semibold text-sm" data-testid={`slide-badge-${index}`}>
                        {slide.badge}
                      </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 text-foreground" data-testid={`slide-title-${index}`}>
                      {slide.title.split(' ').map((word, i) => 
                        word === 'Premium' || word === 'Models' || word === 'New' || word === '24/7' ? (
                          <span key={i} className="text-gold-primary">{word} </span>
                        ) : (
                          <span key={i}>{word} </span>
                        )
                      )}
                    </h1>
                    <p className="text-lg text-muted mb-6" data-testid={`slide-subtitle-${index}`}>
                      {slide.subtitle}
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={goToLogin}
                        className="px-8 py-3 btn-gold text-background rounded-lg font-semibold text-lg shadow-xl inline-flex items-center cursor-pointer" 
                        data-testid="button-start-show"
                      >
                        <i className="fas fa-video mr-2"></i>
                        {t('startPrivateShow')}
                      </button>
                      <button 
                        onClick={scrollToModels}
                        className="px-8 py-3 bg-card/80 backdrop-blur-sm hover:bg-card-hover text-foreground rounded-lg font-semibold text-lg inline-flex items-center cursor-pointer" 
                        data-testid="button-browse-models"
                      >
                        {t('browseModels')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Carousel controls */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-card/80 backdrop-blur-sm hover:bg-card-hover rounded-full flex items-center justify-center text-foreground"
            data-testid="button-carousel-prev"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-card/80 backdrop-blur-sm hover:bg-card-hover rounded-full flex items-center justify-center text-foreground"
            data-testid="button-carousel-next"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
          
          {/* Carousel indicators */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2" data-testid="carousel-indicators">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-gold-primary' : 'bg-muted hover:bg-foreground'
                }`}
                data-testid={`carousel-indicator-${index}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
