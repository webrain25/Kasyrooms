import { useState } from "react";

export default function Header() {
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-secondary/95 backdrop-blur-sm border-b border-border" data-testid="header">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-8">
            <a href="/" className="flex items-center space-x-2" data-testid="logo">
              <div className="w-10 h-10 bg-gradient-to-br from-gold-primary to-gold-accent rounded-lg flex items-center justify-center">
                <i className="fas fa-crown text-background text-xl"></i>
              </div>
              <span className="text-xl font-bold text-foreground">
                Kasynoir <span className="text-gold-primary">Live</span>
              </span>
            </a>
            
            {/* Navigation */}
            <nav className="hidden lg:flex items-center space-x-6" data-testid="navigation">
              <a href="#" className="text-foreground hover:text-gold-primary font-medium" data-testid="nav-home">Home</a>
              <a href="#" className="text-muted hover:text-gold-primary font-medium" data-testid="nav-models">Models</a>
              <a href="#" className="text-muted hover:text-gold-primary font-medium" data-testid="nav-categories">Categories</a>
              <a href="#" className="text-muted hover:text-gold-primary font-medium" data-testid="nav-vip">VIP Club</a>
              <a href="#" className="text-muted hover:text-gold-primary font-medium" data-testid="nav-promotions">Promotions</a>
            </nav>
          </div>
          
          {/* Search and Auth */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:flex items-center bg-card rounded-lg px-4 py-2 w-64" data-testid="search-container">
              <i className="fas fa-search text-muted mr-2"></i>
              <input
                type="text"
                placeholder="Search models..."
                className="bg-transparent border-none outline-none text-sm text-foreground placeholder-muted w-full"
                data-testid="input-search"
              />
            </div>
            
            {/* Mobile search toggle */}
            <button
              className="md:hidden text-foreground hover:text-gold-primary"
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              data-testid="button-search-mobile"
            >
              <i className="fas fa-search text-xl"></i>
            </button>
            
            {/* Auth Buttons */}
            <button className="hidden md:block px-6 py-2 bg-card hover:bg-card-hover text-foreground rounded-lg font-medium" data-testid="button-login">
              Login
            </button>
            <button className="px-6 py-2 btn-gold text-background rounded-lg font-semibold shadow-lg" data-testid="button-register">
              Register
            </button>
            
            {/* Mobile Menu */}
            <button className="lg:hidden text-foreground" data-testid="button-mobile-menu">
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
        
        {/* Mobile Search */}
        {isSearchVisible && (
          <div className="md:hidden py-4 border-t border-border" data-testid="mobile-search">
            <div className="flex items-center bg-card rounded-lg px-4 py-2">
              <i className="fas fa-search text-muted mr-2"></i>
              <input
                type="text"
                placeholder="Search models..."
                className="bg-transparent border-none outline-none text-sm text-foreground placeholder-muted w-full"
                data-testid="input-search-mobile"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
