import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserService } from '../services/user.service';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    username: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/auth`;

    // Signal to track authentication state
    isAuthenticated = signal(false);
    currentUser = signal<string | null>(null);
    currentUserRole = signal<string | null>(null);

    constructor() {
        // Check if user is already logged in
        const token = this.getToken();
        if (token) {
            if (this.isTokenExpired(token)) {
                this.logout();
            } else {
                this.isAuthenticated.set(true);
                this.currentUser.set(localStorage.getItem('username'));
                this.decodeToken(token);
                this.verifySession();
            }
        }
    }

    private verifySession(): void {
        const userService = inject(UserService); // Lazy inject to avoid circular dependency if UserService injects AuthService (unlikely but safe)
        // Actually UserService doesn't seem to depend on AuthService so constructor injection is fine,
        // but circular dependency is common with Interceptors/AuthService/UserService.
        // Let's rely on HTTP call failing with 401 to trigger logout via Interceptor/Service logic
        // But the plan was "Implement session verification (e.g., `whoami` check on startup)"

        // However, I can't easily inject UserService here if it wasn't already.
        // Let's use HttpClient directly or rely on the Fact that I can just try to make a call?
        // Actually, cleaner is to just Decode locally first (done above).
        // Then make a call to profile to be sure.

        // Wait, circular dep risk: UserService -> HttpClient -> AuthInterceptor -> AuthService.
        // If I inject UserService here, it's fine. AuthService is usually root.

        // I'll dynamically inject HttpClient to avoid issues or just assume the first request (e.g. loading home) will fail if invalid.
        // BUT the user asked explicitly for this check.

        this.http.get(`${environment.apiUrl}/api/account/profile`).subscribe({
            error: () => {
                // If this fails (e.g. 401, user deleted), logic should log us out.
                // The ErrorInterceptor should handle the 401.
                // But if it returns 404 (user deleted but token valid), we should also logout.
                this.logout();
            }
        });
    }

    login(credentials: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
            tap(response => {
                localStorage.setItem('token', response.token);
                localStorage.setItem('username', response.username);
                this.isAuthenticated.set(true);
                this.currentUser.set(response.username);
                this.decodeToken(response.token);
            })
        );
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        this.currentUserRole.set(null);
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    private isTokenExpired(token: string): boolean {
        try {
            const decoded: any = jwtDecode(token);
            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        } catch (error) {
            return true;
        }
    }

    private decodeToken(token: string): void {
        try {
            const decoded: any = jwtDecode(token);
            // Default claim type for Role in .NET Identity
            const role = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded['role'];
            this.currentUserRole.set(role);
        } catch (error) {
            console.error('Error decoding token', error);
            this.logout();
        }
    }

    hasRole(role: string): boolean {
        return this.currentUserRole() === role;
    }

    isAdmin(): boolean {
        const role = this.currentUserRole();
        return role === 'Admin' || role === 'SuperAdmin';
    }

    isSuperAdmin(): boolean {
        return this.currentUserRole() === 'SuperAdmin';
    }
}
