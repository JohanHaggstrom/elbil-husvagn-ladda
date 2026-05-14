import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorService } from './error.service';

describe('ErrorService', () => {
    let snackBar: { open: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        snackBar = { open: vi.fn() };
        TestBed.configureTestingModule({
            providers: [{ provide: MatSnackBar, useValue: snackBar }],
        });
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('parseError via handleError', () => {
        it('classifies status 0 as network error', () => {
            const service = TestBed.inject(ErrorService);
            service.handleError(new HttpErrorResponse({ status: 0 }));

            const recent = service.getRecentErrors();
            expect(recent).toHaveLength(1);
            expect(recent[0].type).toBe('network');
            expect(recent[0].message).toBe('Kan inte ansluta till servern');
        });

        it('classifies status >= 500 as server error', () => {
            const service = TestBed.inject(ErrorService);
            service.handleError(new HttpErrorResponse({ status: 503, error: { message: 'oops' } }));

            const recent = service.getRecentErrors();
            expect(recent[0].type).toBe('server');
            expect(recent[0].details).toBe('oops');
        });

        it('classifies 4xx as client error', () => {
            const service = TestBed.inject(ErrorService);
            service.handleError(new HttpErrorResponse({ status: 404, error: { message: 'not found' } }));

            const recent = service.getRecentErrors();
            expect(recent[0].type).toBe('client');
            expect(recent[0].details).toBe('not found');
        });

        it('classifies non-HTTP errors as unknown and uses context as message', () => {
            const service = TestBed.inject(ErrorService);
            service.handleError(new Error('boom'), 'During import');

            const recent = service.getRecentErrors();
            expect(recent[0].type).toBe('unknown');
            expect(recent[0].message).toBe('During import');
            expect(recent[0].details).toBe('boom');
        });
    });

    describe('snackbar duration', () => {
        it('uses 10s duration for network errors and 5s for others', () => {
            const service = TestBed.inject(ErrorService);

            service.handleError(new HttpErrorResponse({ status: 0 }));
            expect(snackBar.open).toHaveBeenLastCalledWith(
                expect.any(String),
                'Stäng',
                expect.objectContaining({ duration: 10000 }),
            );

            service.handleError(new HttpErrorResponse({ status: 500 }));
            expect(snackBar.open).toHaveBeenLastCalledWith(
                expect.any(String),
                'Stäng',
                expect.objectContaining({ duration: 5000 }),
            );
        });
    });

    describe('error log management', () => {
        it('caps the stored errors at 50', () => {
            const service = TestBed.inject(ErrorService);

            for (let i = 0; i < 55; i++) {
                service.handleError(new Error(`err-${i}`));
            }

            const recent = service.getRecentErrors();
            expect(recent).toHaveLength(50);
            expect(recent[0].details).toBe('err-5');
            expect(recent[49].details).toBe('err-54');
        });

        it('clearErrors empties the log', () => {
            const service = TestBed.inject(ErrorService);
            service.handleError(new Error('x'));
            expect(service.getRecentErrors()).toHaveLength(1);

            service.clearErrors();
            expect(service.getRecentErrors()).toHaveLength(0);
        });

        it('getRecentErrors returns a copy, not a live reference', () => {
            const service = TestBed.inject(ErrorService);
            service.handleError(new Error('x'));

            const snapshot = service.getRecentErrors();
            snapshot.pop();

            expect(service.getRecentErrors()).toHaveLength(1);
        });
    });
});
