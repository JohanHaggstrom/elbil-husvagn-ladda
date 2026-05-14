import { TestBed } from '@angular/core/testing';
import {
    ActivatedRouteSnapshot,
    Router,
    RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from './auth.service';
import { superAdminGuard } from './super-admin.guard';

describe('superAdminGuard', () => {
    let navigate: ReturnType<typeof vi.fn>;
    let authService: { isSuperAdmin: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        navigate = vi.fn();
        authService = { isSuperAdmin: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: authService },
                { provide: Router, useValue: { navigate } },
            ],
        });
    });

    const run = () =>
        TestBed.runInInjectionContext(() =>
            superAdminGuard(
                {} as ActivatedRouteSnapshot,
                {} as RouterStateSnapshot,
            ),
        );

    it('allows super-admins through', () => {
        authService.isSuperAdmin.mockReturnValue(true);
        expect(run()).toBe(true);
        expect(navigate).not.toHaveBeenCalled();
    });

    it('redirects everyone else to home', () => {
        authService.isSuperAdmin.mockReturnValue(false);
        expect(run()).toBe(false);
        expect(navigate).toHaveBeenCalledWith(['/']);
    });
});
