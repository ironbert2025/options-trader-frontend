import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
  accessToken: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://3.133.58.172:5000/api/auth/login';
  private readonly tokenKey = 'access_token';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, { username, password }).pipe(
      tap(res => localStorage.setItem(this.tokenKey, res.accessToken))
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserFullName(): string | null {
    const claims = this.getTokenClaims();
    if (!claims) return null;
    const givenName = claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'];
    const surname = claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'];
    if (!givenName && !surname) return null;
    return [givenName, surname].filter(Boolean).join(' ');
  }

  private getTokenClaims(): Record<string, string> | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(normalized));
    } catch {
      return null;
    }
  }
}
