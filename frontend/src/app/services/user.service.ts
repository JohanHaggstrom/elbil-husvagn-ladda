import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
    id: number;
    username: string;
    email: string;
    role: 'User' | 'Admin' | 'SuperAdmin';
    createdAt: string;
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

    getUserByUsername(username: string): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/account/profile`);
    }

    createUser(user: any): Observable<User> {
        return this.http.post<User>(`${this.apiUrl}/users`, user);
    }

    updateUser(id: number, user: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/users/${id}`, user);
    }

    deleteUser(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/users/${id}`);
    }

    resetPassword(id: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/users/${id}/reset-password`, {});
    }

    changePassword(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/account/change-password`, data);
    }

    updateProfile(email: string, username: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/account/profile`, {
            email,
            username,
        });
    }
}
