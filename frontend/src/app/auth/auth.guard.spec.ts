import { TestBed } from '@angular/core/testing';
import {
    ActivatedRouteSnapshot,
    Router,
    RouterStateSnapshot,
} from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
    let navigate: ReturnType<typeof vi.fn>;
    let authService: { isAuthenticated: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        navigate = vi.fn();
        authService = { isAuthenticated: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: authService },
                { provide: Router, useValue: { navigate } },
            ],
        });
    });

    const run = () =>
        TestBed.runInInjectionContext(() =>
            authGuard(
                {} as ActivatedRouteSnapshot,
                {} as RouterStateSnapshot,
            ),
        );

    it('allows navigation when the user is authenticated', () => {
        authService.isAuthenticated.mockReturnValue(true);
        expect(run()).toBe(true);
        expect(navigate).not.toHaveBeenCalled();
    });

    it('blocks and redirects to /login when the user is not authenticated', () => {
        authService.isAuthenticated.mockReturnValue(false);
        expect(run()).toBe(false);
        expect(navigate).toHaveBeenCalledWith(['/login']);
    });
});
