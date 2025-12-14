import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

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
            this.isAuthenticated.set(true);
            this.currentUser.set(localStorage.getItem('username'));
            this.decodeToken(token);
        }
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
