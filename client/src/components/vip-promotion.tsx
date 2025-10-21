export default function VipPromotion() {
  const goVip = () => { window.location.href = "/vip"; };

  return (
    <section className="py-16 bg-gradient-to-br from-gold-dark via-gold-primary to-gold-accent relative overflow-hidden" data-testid="vip-promotion">
      <div className="absolute inset-0 opacity-10">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)"
          }}
        ></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-background/20 backdrop-blur-sm rounded-full mb-6">
            <i className="fas fa-crown text-background text-4xl"></i>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-background mb-4" data-testid="vip-title">
            Upgrade to VIP Membership
          </h2>
          <p className="text-lg text-background/90 mb-8" data-testid="vip-subtitle">
            Get exclusive access to VIP models, priority chat, private show discounts, and ad-free experience
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <div className="bg-background/20 backdrop-blur-sm rounded-lg p-4 min-w-[150px]" data-testid="vip-stat-models">
              <div className="text-3xl font-bold text-background mb-1">100+</div>
              <div className="text-sm text-background/80">VIP Models</div>
            </div>
            <div className="bg-background/20 backdrop-blur-sm rounded-lg p-4 min-w-[150px]" data-testid="vip-stat-discount">
              <div className="text-3xl font-bold text-background mb-1">50%</div>
              <div className="text-sm text-background/80">Show Discount</div>
            </div>
            <div className="bg-background/20 backdrop-blur-sm rounded-lg p-4 min-w-[150px]" data-testid="vip-stat-support">
              <div className="text-3xl font-bold text-background mb-1">24/7</div>
              <div className="text-sm text-background/80">Priority Support</div>
            </div>
          </div>
          
          <button 
            onClick={goVip}
            className="px-12 py-4 bg-background hover:bg-card text-gold-primary rounded-lg font-bold text-lg shadow-2xl transform hover:scale-105 transition-all cursor-pointer" 
            data-testid="button-become-vip"
          >
            <i className="fas fa-crown mr-2"></i>
            Become VIP Member
          </button>
        </div>
      </div>
    </section>
  );
}
