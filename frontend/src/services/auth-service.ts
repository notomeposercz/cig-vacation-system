import axios from 'axios';
import jwtDecode from 'jwt-decode';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface DecodedToken {
  sub: string;
  email: string;
  role: string;
  exp: number;
}

class AuthService {
  private baseURL: string = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  private accessTokenKey: string = 'access_token';
  private refreshTokenKey: string = 'refresh_token';
  private userKey: string = 'user';

  // Přihlášení uživatele
  public async login(email: string, password: string): Promise<User> {
    try {
      const response = await axios.post<AuthTokens>(`${this.baseURL}/auth/login`, {
        email,
        password,
      });

      this.setTokens(response.data.accessToken, response.data.refreshToken);
      this.setUser(response.data.user);

      return response.data.user;
    } catch (error) {
      throw new Error('Authentication failed');
    }
  }

  // Obnovení tokenu
  public async refreshToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post<AuthTokens>(`${this.baseURL}/auth/refresh-token`, {
        refreshToken,
      });

      this.setTokens(response.data.accessToken, response.data.refreshToken);
      this.setUser(response.data.user);
    } catch (error) {
      this.logout();
      throw new Error('Token refresh failed');
    }
  }

  // Odhlášení uživatele
  public async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();

    if (refreshToken) {
      try {
        await axios.post(
          `${this.baseURL}/auth/logout`,
          { refreshToken },
          {
            headers: {
              Authorization: `Bearer ${this.getAccessToken()}`,
            },
          }
        );
      } catch (error) {
        console.error('Logout failed', error);
      }
    }

    // Odstranění tokenů a uživatele z lokálního úložiště
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Uložení tokenů
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.accessTokenKey, accessToken);
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }

  // Uložení uživatele
  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Získání access tokenu
  public getAccessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  // Získání refresh tokenu
  public getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Získání přihlášeného uživatele
  public getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Kontrola, zda je uživatel přihlášen
  public isAuthenticated(): boolean {
    const token = this.getAccessToken();
    
    if (!token) {
      return false;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;
      
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Kontrola role uživatele
  public hasRole(role: string | string[]): boolean {
    const user = this.getUser();
    
    if (!user) {
      return false;
    }

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }

    return user.role === role;
  }
}

export const authService = new AuthService();
