import { HttpClient, withInterceptors, provideHttpClient } from '@angular/common/http';
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
    let http: HttpClient;
    let testing: HttpTestingController;
    let token: string | null;

    beforeEach(() => {
        token = null;
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([authInterceptor])),
                provideHttpClientTesting(),
                {
                    provide: AuthService,
                    useValue: { getToken: () => token },
                },
            ],
        });
        http = TestBed.inject(HttpClient);
        testing = TestBed.inject(HttpTestingController);
    });

    afterEach(() => testing.verify());

    it('attaches Authorization header when a token is present', () => {
        token = 'abc123';
        http.get('/x').subscribe();
        const req = testing.expectOne('/x');
        expect(req.request.headers.get('Authorization')).toBe('Bearer abc123');
        req.flush({});
    });

    it('does not attach an Authorization header when no token is present', () => {
        token = null;
        http.get('/x').subscribe();
        const req = testing.expectOne('/x');
        expect(req.request.headers.has('Authorization')).toBe(false);
        req.flush({});
    });
});
