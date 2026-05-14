import { provideHttpClient } from '@angular/common/http';
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

function makeJwt(payload: object): string {
    const enc = (o: object) =>
        btoa(JSON.stringify(o)).replace(/=+$/, '');
    return `${enc({ alg: 'HS256', typ: 'JWT' })}.${enc(payload)}.sig`;
}

const futureExp = () => Math.floor(Date.now() / 1000) + 3600;
const pastExp = () => Math.floor(Date.now() / 1000) - 10;

describe('AuthService', () => {
    let http: HttpTestingController;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        http.verify();
    });

    it('starts unauthenticated when no token is stored', () => {
        const service = TestBed.inject(AuthService);
        expect(service.isAuthenticated()).toBe(false);
        expect(service.currentUser()).toBeNull();
        expect(service.currentUserRole()).toBeNull();
    });

    describe('login', () => {
        it('stores token, sets signals and decodes role on success', () => {
            const service = TestBed.inject(AuthService);
            const token = makeJwt({ exp: futureExp(), role: 'Admin' });

            service.login({ username: 'bob', password: 'pw' }).subscribe();

            const req = http.expectOne(`${environment.apiUrl}/api/auth/login`);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual({ username: 'bob', password: 'pw' });
            req.flush({ token, username: 'bob' });

            expect(localStorage.getItem('token')).toBe(token);
            expect(localStorage.getItem('username')).toBe('bob');
            expect(service.isAuthenticated()).toBe(true);
            expect(service.currentUser()).toBe('bob');
            expect(service.isAdmin()).toBe(true);
            expect(service.isSuperAdmin()).toBe(false);
        });
    });

    describe('logout', () => {
        it('clears storage and signals', () => {
            const service = TestBed.inject(AuthService);
            const token = makeJwt({ exp: futureExp(), role: 'Admin' });

            service.login({ username: 'bob', password: 'pw' }).subscribe();
            http.expectOne(`${environment.apiUrl}/api/auth/login`)
                .flush({ token, username: 'bob' });

            service.logout();

            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('username')).toBeNull();
            expect(service.isAuthenticated()).toBe(false);
            expect(service.currentUser()).toBeNull();
            expect(service.currentUserRole()).toBeNull();
        });
    });

    describe('constructor', () => {
        it('restores session and verifies it on backend when a valid token is stored', () => {
            const token = makeJwt({ exp: futureExp(), role: 'SuperAdmin' });
            localStorage.setItem('token', token);
            localStorage.setItem('username', 'admin');

            const service = TestBed.inject(AuthService);

            const req = http.expectOne(
                `${environment.apiUrl}/api/account/profile`,
            );
            req.flush({});

            expect(service.isAuthenticated()).toBe(true);
            expect(service.currentUser()).toBe('admin');
            expect(service.isSuperAdmin()).toBe(true);
            expect(service.isAdmin()).toBe(true);
        });

        it('logs out when the stored token is expired', () => {
            const token = makeJwt({ exp: pastExp(), role: 'Admin' });
            localStorage.setItem('token', token);
            localStorage.setItem('username', 'bob');

            const service = TestBed.inject(AuthService);

            expect(service.isAuthenticated()).toBe(false);
            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('username')).toBeNull();
        });

        it('logs out when the stored token is malformed', () => {
            localStorage.setItem('token', 'not-a-jwt');

            const service = TestBed.inject(AuthService);

            expect(service.isAuthenticated()).toBe(false);
            expect(localStorage.getItem('token')).toBeNull();
        });
    });

    describe('role helpers', () => {
        function loginAs(role: string): AuthService {
            const service = TestBed.inject(AuthService);
            const token = makeJwt({ exp: futureExp(), role });
            service.login({ username: 'u', password: 'p' }).subscribe();
            http.expectOne(`${environment.apiUrl}/api/auth/login`)
                .flush({ token, username: 'u' });
            return service;
        }

        it('isAdmin is true for Admin', () => {
            const service = loginAs('Admin');
            expect(service.isAdmin()).toBe(true);
            expect(service.isSuperAdmin()).toBe(false);
        });

        it('isAdmin is true for SuperAdmin', () => {
            const service = loginAs('SuperAdmin');
            expect(service.isAdmin()).toBe(true);
            expect(service.isSuperAdmin()).toBe(true);
        });

        it('isAdmin is false for regular users', () => {
            const service = loginAs('User');
            expect(service.isAdmin()).toBe(false);
            expect(service.isSuperAdmin()).toBe(false);
        });

        it('hasRole matches exact role string', () => {
            const service = loginAs('Admin');
            expect(service.hasRole('Admin')).toBe(true);
            expect(service.hasRole('SuperAdmin')).toBe(false);
        });
    });
});
