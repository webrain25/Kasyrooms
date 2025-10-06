export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary border-t border-border pt-12 pb-6" data-testid="footer">
      <div className="container mx-auto px-4">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div data-testid="footer-about">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-gold-primary to-gold-accent rounded-lg flex items-center justify-center">
                <i className="fas fa-crown text-background"></i>
              </div>
              <span className="text-lg font-bold">Kasynoir <span className="text-gold-primary">Live</span></span>
            </div>
            <p className="text-muted text-sm mb-4">
              Premium video chat platform connecting you with verified models worldwide.
            </p>
            <div className="flex space-x-3">
              <a href="#" className="w-9 h-9 bg-card hover:bg-gold-primary rounded-lg flex items-center justify-center text-muted hover:text-background transition-colors" data-testid="social-twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="w-9 h-9 bg-card hover:bg-gold-primary rounded-lg flex items-center justify-center text-muted hover:text-background transition-colors" data-testid="social-instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="w-9 h-9 bg-card hover:bg-gold-primary rounded-lg flex items-center justify-center text-muted hover:text-background transition-colors" data-testid="social-telegram">
                <i className="fab fa-telegram"></i>
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div data-testid="footer-links">
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-link-browse">Browse Models</a></li>
              <li><a href="#" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-link-vip">VIP Membership</a></li>
              <li><a href="#" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-link-promotions">Promotions</a></li>
              <li><a href="#" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-link-become-model">Become a Model</a></li>
              <li><a href="#" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-link-affiliate">Affiliate Program</a></li>
            </ul>
          </div>
          
          {/* Support */}
          <div data-testid="footer-support">
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-link-help">Help Center</a></li>
              <li><a href="#" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-link-contact">Contact Us</a></li>
              <li><a href="#" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-link-terms">Terms of Service</a></li>
              <li><a href="#" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-link-privacy">Privacy Policy</a></li>
              <li><a href="#" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-link-cookies">Cookie Policy</a></li>
            </ul>
          </div>
          
          {/* Payment Methods */}
          <div data-testid="footer-payments">
            <h3 className="font-semibold text-foreground mb-4">Secure Payments</h3>
            <p className="text-muted text-sm mb-4">We accept all major payment methods</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="w-12 h-8 bg-card rounded flex items-center justify-center" data-testid="payment-visa">
                <i className="fab fa-cc-visa text-muted"></i>
              </div>
              <div className="w-12 h-8 bg-card rounded flex items-center justify-center" data-testid="payment-mastercard">
                <i className="fab fa-cc-mastercard text-muted"></i>
              </div>
              <div className="w-12 h-8 bg-card rounded flex items-center justify-center" data-testid="payment-amex">
                <i className="fab fa-cc-amex text-muted"></i>
              </div>
              <div className="w-12 h-8 bg-card rounded flex items-center justify-center" data-testid="payment-bitcoin">
                <i className="fab fa-bitcoin text-muted"></i>
              </div>
            </div>
            
            <div className="p-3 bg-card rounded-lg">
              <div className="flex items-center space-x-2 text-xs text-muted">
                <i className="fas fa-shield-alt text-online"></i>
                <span>SSL Encrypted & Secure</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Bottom */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-muted text-sm text-center md:text-left" data-testid="footer-copyright">
              © {currentYear} Kasynoir Live. All rights reserved. | 18+ Only
            </p>
            <div className="flex items-center space-x-6 text-sm">
              <a href="#" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-privacy-link">Privacy</a>
              <a href="#" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-terms-link">Terms</a>
              <a href="#" className="text-muted hover:text-gold-primary transition-colors" data-testid="footer-cookies-link">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
