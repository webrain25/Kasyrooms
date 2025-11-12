import { createContext, useContext, ReactNode, useState, useEffect } from "react";

interface User {
  id: string;
  username: string;
  email?: string;
  role?: 'user' | 'model' | 'admin';
}

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // ISO date (yyyy-mm-dd)
  cardBrand?: string;
  cardLast4?: string;
  expMonth?: number;
  expYear?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  // Demo accounts ignore password; keep param for future real auth but do not send to API
  login: (username: string, password?: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // TODO: Check for valid token/session
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
        if (savedToken) setToken(savedToken);
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, _password?: string) => {
    try {
      // Backend expects only { username }
      const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username }) });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      const u: User = data.user;
      setUser(u);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('token', data.token);
    } catch (error) {
      throw new Error('Login failed: usa "utente", "modella" o "admin"');
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Registration failed');
      }
      const data = await res.json();
      const u: User = data.user;
      setUser(u);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(u));
      localStorage.setItem('token', data.token);
    } catch (error: unknown) {
      const message = (error instanceof Error && error.message) ? error.message : 'Registration failed';
      throw new Error(message);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      token,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
