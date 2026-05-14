import { TestBed } from '@angular/core/testing';
import {
    ActivatedRouteSnapshot,
    Router,
    RouterStateSnapshot,
} from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from './auth.service';

describe('adminGuard', () => {
    let navigate: ReturnType<typeof vi.fn>;
    let authService: { isAdmin: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        navigate = vi.fn();
        authService = { isAdmin: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: authService },
                { provide: Router, useValue: { navigate } },
            ],
        });
    });

    const run = () =>
        TestBed.runInInjectionContext(() =>
            adminGuard(
                {} as ActivatedRouteSnapshot,
                {} as RouterStateSnapshot,
            ),
        );

    it('allows admins through', () => {
        authService.isAdmin.mockReturnValue(true);
        expect(run()).toBe(true);
        expect(navigate).not.toHaveBeenCalled();
    });

    it('redirects non-admins to home', () => {
        authService.isAdmin.mockReturnValue(false);
        expect(run()).toBe(false);
        expect(navigate).toHaveBeenCalledWith(['/']);
    });
});
