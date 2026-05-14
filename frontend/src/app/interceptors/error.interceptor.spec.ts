import {
    HttpClient,
    provideHttpClient,
    withInterceptors,
} from '@angular/common/http';
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { ErrorService } from '../services/error.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
    let http: HttpClient;
    let testing: HttpTestingController;
    let authService: { logout: ReturnType<typeof vi.fn> };
    let errorService: { handleError: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        authService = { logout: vi.fn() };
        errorService = { handleError: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([errorInterceptor])),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authService },
                { provide: ErrorService, useValue: errorService },
            ],
        });
        http = TestBed.inject(HttpClient);
        testing = TestBed.inject(HttpTestingController);
    });

    afterEach(() => testing.verify());

    it('logs the user out on a 401 response', () => {
        http.post('/x', {}).subscribe({ error: () => {} });
        testing.expectOne('/x').flush(
            { message: 'unauthorized' },
            { status: 401, statusText: 'Unauthorized' },
        );

        expect(authService.logout).toHaveBeenCalled();
        expect(errorService.handleError).not.toHaveBeenCalled();
    });

    it('routes non-401 errors through ErrorService', () => {
        http.post('/x', {}).subscribe({ error: () => {} });
        testing.expectOne('/x').flush(
            { message: 'boom' },
            { status: 500, statusText: 'Server Error' },
        );

        expect(errorService.handleError).toHaveBeenCalled();
        expect(authService.logout).not.toHaveBeenCalled();
    });

    it('passes successful responses through untouched', () => {
        let result: unknown;
        http.get('/x').subscribe((v) => (result = v));
        testing.expectOne('/x').flush({ ok: true });

        expect(result).toEqual({ ok: true });
        expect(authService.logout).not.toHaveBeenCalled();
        expect(errorService.handleError).not.toHaveBeenCalled();
    });
});
