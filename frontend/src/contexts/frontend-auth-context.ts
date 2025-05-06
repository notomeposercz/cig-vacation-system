import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/auth.service';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Kontrola, zda je uživatel již přihlášen
    const initAuth = async () => {
      setLoading(true);
      
      try {
        // Kontrola, zda je platný token
        if (authService.isAuthenticated()) {
          // Načtení dat uživatele z localStorage
          const userData = authService.getUser();
          if (userData) {
            setUser(userData);
          }
        }
      } catch (err) {
        console.error('Authentication error:', err);
        setError('Chyba autentizace. Prosím, přihlaste se znovu.');
        await authService.logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      const userData = await authService.login(email, password);
      setUser(userData);
    } catch (err) {
      setError('Neplatné přihlašovací údaje. Zkontrolujte své uživatelské jméno a heslo.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true);
    
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      setError('Chyba při odhlašování.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = (): boolean => {
    return authService.isAuthenticated();
  };

  const hasRole = (role: string | string[]): boolean => {
    return authService.hasRole(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
