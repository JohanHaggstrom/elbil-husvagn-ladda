import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type UserRole = 'User' | 'Admin' | 'SuperAdmin';

export interface User {
    id: number;
    username: string;
    email: string;
    role: UserRole;
    createdAt: string;
}

export interface CreateUserRequest {
    username: string;
    email: string;
    password: string;
    role: UserRole;
}

export interface UpdateUserRequest {
    email: string;
    role: UserRole;
}

export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api`;

    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/users`);
    }

    getProfile(): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/account/profile`);
    }

    createUser(user: CreateUserRequest): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/users`, user);
    }

    updateUser(id: number, user: UpdateUserRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/users/${id}`, user);
    }

    deleteUser(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/users/${id}`);
    }

    resetPassword(id: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/users/${id}/reset-password`, {});
    }

    changePassword(data: ChangePasswordRequest): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/account/change-password`, data);
    }

    updateProfile(email: string, username: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/account/profile`, {
            email,
            username,
        });
    }

    validatePassword(password: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/account/validate-password`, {
            password,
        });
    }
}
