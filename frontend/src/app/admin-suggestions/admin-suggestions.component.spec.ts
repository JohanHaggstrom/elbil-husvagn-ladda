import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ChargingPoint, ChargingStationService } from '../services/charging-station.service';
import { AdminSuggestionsComponent } from './admin-suggestions.component';

describe('AdminSuggestionsComponent', () => {
    let service: {
        getSuggestedChargingPointsPaged: ReturnType<typeof vi.fn>;
        approveSuggestedChargingPoint: ReturnType<typeof vi.fn>;
        deleteSuggestedChargingPoint: ReturnType<typeof vi.fn>;
    };
    let auth: { isAuthenticated: ReturnType<typeof vi.fn> };
    let router: { navigate: ReturnType<typeof vi.fn> };
    let snackBar: { open: ReturnType<typeof vi.fn> };
    let dialog: { open: ReturnType<typeof vi.fn> };

    function makePoint(overrides: Partial<ChargingPoint> = {}): ChargingPoint {
        return {
            id: 1,
            title: 'Stop',
            address1: 'Main 1',
            postalCode: '12345',
            city: 'Town',
            country: 'SE',
            mapCoordinates: '59.3,18.0',
            capacity: 22,
            ...overrides,
        };
    }

    beforeEach(() => {
        service = {
            getSuggestedChargingPointsPaged: vi.fn().mockReturnValue(of({ items: [], total: 0, page: 1, pageSize: 20 })),
            approveSuggestedChargingPoint: vi.fn().mockReturnValue(of(makePoint())),
            deleteSuggestedChargingPoint: vi.fn().mockReturnValue(of(void 0)),
        };
        auth = { isAuthenticated: vi.fn().mockReturnValue(true) };
        router = { navigate: vi.fn() };
        snackBar = { open: vi.fn() };
        dialog = { open: vi.fn() };

        TestBed.configureTestingModule({
            imports: [AdminSuggestionsComponent],
            providers: [
                { provide: ChargingStationService, useValue: service },
                { provide: AuthService, useValue: auth },
                { provide: Router, useValue: router },
                { provide: MatSnackBar, useValue: snackBar },
                { provide: MatDialog, useValue: dialog },
            ],
        });

        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function create(): AdminSuggestionsComponent {
        const fixture = TestBed.createComponent(AdminSuggestionsComponent);
        const c = fixture.componentInstance;
        c.ngOnInit();
        return c;
    }

    it('redirects to /login when not authenticated', () => {
        auth.isAuthenticated.mockReturnValue(false);
        const fixture = TestBed.createComponent(AdminSuggestionsComponent);
        fixture.componentInstance.ngOnInit();

        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        expect(service.getSuggestedChargingPointsPaged).not.toHaveBeenCalled();
    });

    it('clamps pageIndex when current page exceeds last', () => {
        service.getSuggestedChargingPointsPaged
            .mockReturnValueOnce(of({ items: [], total: 10, page: 5, pageSize: 20 }))
            .mockReturnValueOnce(of({ items: [makePoint()], total: 10, page: 1, pageSize: 20 }));

        const c = create();
        c.pageIndex = 4;
        c.loadSuggestions();

        expect(c.pageIndex).toBe(0);
    });

    it('approveSuggestion aborts when confirm is rejected', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        const c = create();

        c.approveSuggestion(makePoint());

        expect(service.approveSuggestedChargingPoint).not.toHaveBeenCalled();
    });

    it('approveSuggestion calls service and reloads on success', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        const c = create();
        const before = service.getSuggestedChargingPointsPaged.mock.calls.length;

        c.approveSuggestion(makePoint());

        expect(service.approveSuggestedChargingPoint).toHaveBeenCalledWith(1);
        expect(service.getSuggestedChargingPointsPaged).toHaveBeenCalledTimes(before + 1);
    });

    it('deleteSuggestion shows error snackbar on failure', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        service.deleteSuggestedChargingPoint.mockReturnValue(throwError(() => new Error('x')));
        const c = create();

        c.deleteSuggestion(makePoint());

        expect(snackBar.open).toHaveBeenCalledWith('Kunde inte ta bort förslag', 'Stäng', expect.any(Object));
    });

    describe('viewOnMap (parseCoordinates)', () => {
        it('opens the map dialog when coordinates parse', () => {
            const c = create();
            c.viewOnMap(makePoint({ mapCoordinates: '59.33, 18.07' }));

            expect(dialog.open).toHaveBeenCalledTimes(1);
            const args = dialog.open.mock.calls[0];
            expect(args[1].data).toEqual({ lat: 59.33, lng: 18.07, title: 'Stop' });
        });

        it('shows error snackbar on invalid coordinates', () => {
            const c = create();
            c.viewOnMap(makePoint({ mapCoordinates: 'not-coords' }));

            expect(dialog.open).not.toHaveBeenCalled();
            expect(snackBar.open).toHaveBeenCalledWith('Ogiltiga koordinater', 'Stäng', expect.any(Object));
        });

        it('rejects when only one number is present', () => {
            const c = create();
            c.viewOnMap(makePoint({ mapCoordinates: '59.33' }));

            expect(dialog.open).not.toHaveBeenCalled();
        });
    });
});
