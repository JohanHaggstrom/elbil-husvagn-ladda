import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
    let auth: { login: ReturnType<typeof vi.fn> };
    let router: { navigate: ReturnType<typeof vi.fn> };
    let snackBar: { open: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        auth = { login: vi.fn() };
        router = { navigate: vi.fn() };
        snackBar = { open: vi.fn() };

        TestBed.configureTestingModule({
            imports: [LoginComponent],
            providers: [
                { provide: AuthService, useValue: auth },
                { provide: Router, useValue: router },
                { provide: MatSnackBar, useValue: snackBar },
            ],
        });

        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function create(): LoginComponent {
        return TestBed.createComponent(LoginComponent).componentInstance;
    }

    it('shows a snackbar and does not call login when fields are empty', async () => {
        const c = create();
        await c.onSubmit();

        expect(auth.login).not.toHaveBeenCalled();
        expect(snackBar.open).toHaveBeenCalledWith(
            'Vänligen fyll i både användarnamn och lösenord',
            'Stäng',
            expect.any(Object),
        );
        expect(c.isLoading).toBe(false);
    });

    it('navigates home on successful login', async () => {
        auth.login.mockReturnValue(of({ token: 't', username: 'u' }));
        const c = create();
        c.username = 'u';
        c.password = 'p';

        await c.onSubmit();

        expect(auth.login).toHaveBeenCalledWith({ username: 'u', password: 'p' });
        expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('shows error snackbar and resets loading on failure', async () => {
        auth.login.mockReturnValue(throwError(() => new Error('bad creds')));
        const c = create();
        c.username = 'u';
        c.password = 'wrong';

        await c.onSubmit();

        expect(router.navigate).not.toHaveBeenCalled();
        expect(snackBar.open).toHaveBeenCalledWith(
            'Felaktigt användarnamn eller lösenord',
            'Stäng',
            expect.any(Object),
        );
        expect(c.isLoading).toBe(false);
    });

    it('onCancel navigates home', () => {
        const c = create();
        c.onCancel();
        expect(router.navigate).toHaveBeenCalledWith(['/']);
    });
});
