import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Feedback, FeedbackType } from '../models/feedback.model';
import { FeedbackService } from '../services/feedback.service';
import { AdminFeedbackComponent } from './admin-feedback.component';

describe('AdminFeedbackComponent', () => {
    let feedbackService: {
        getAllFeedbackPaged: ReturnType<typeof vi.fn>;
        getUnhandledCount: ReturnType<typeof vi.fn>;
        deleteFeedback: ReturnType<typeof vi.fn>;
        markAsHandled: ReturnType<typeof vi.fn>;
        updateAdminResponse: ReturnType<typeof vi.fn>;
    };
    let auth: { isAuthenticated: ReturnType<typeof vi.fn> };
    let router: { navigate: ReturnType<typeof vi.fn> };
    let snackBar: { open: ReturnType<typeof vi.fn> };

    function makeFeedback(overrides: Partial<Feedback> = {}): Feedback {
        return {
            id: 1,
            type: FeedbackType.Improvement,
            title: 'Test',
            description: 'desc',
            isHandled: false,
            ...overrides,
        };
    }

    beforeEach(() => {
        feedbackService = {
            getAllFeedbackPaged: vi.fn().mockReturnValue(of({ items: [], total: 0, page: 1, pageSize: 20 })),
            getUnhandledCount: vi.fn().mockReturnValue(of(0)),
            deleteFeedback: vi.fn().mockReturnValue(of(void 0)),
            markAsHandled: vi.fn().mockReturnValue(of(void 0)),
            updateAdminResponse: vi.fn().mockReturnValue(of(void 0)),
        };
        auth = { isAuthenticated: vi.fn().mockReturnValue(true) };
        router = { navigate: vi.fn() };
        snackBar = { open: vi.fn() };

        TestBed.configureTestingModule({
            imports: [AdminFeedbackComponent],
            providers: [
                { provide: FeedbackService, useValue: feedbackService },
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

    function create(): AdminFeedbackComponent {
        const fixture = TestBed.createComponent(AdminFeedbackComponent);
        const c = fixture.componentInstance;
        c.ngOnInit();
        return c;
    }

    it('redirects to /login when not authenticated', () => {
        auth.isAuthenticated.mockReturnValue(false);
        const fixture = TestBed.createComponent(AdminFeedbackComponent);
        fixture.componentInstance.ngOnInit();

        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        expect(feedbackService.getAllFeedbackPaged).not.toHaveBeenCalled();
    });

    it('clamps pageIndex back when current page exceeds last after a load', () => {
        feedbackService.getAllFeedbackPaged.mockReturnValueOnce(
            of({ items: [], total: 10, page: 5, pageSize: 20 }),
        ).mockReturnValueOnce(
            of({ items: [makeFeedback()], total: 10, page: 1, pageSize: 20 }),
        );

        const c = create();
        c.pageIndex = 4;
        c.loadFeedback();

        expect(c.pageIndex).toBe(0);
        // 1 from ngOnInit, 1 from manual loadFeedback, 1 from the clamp-recall
        expect(feedbackService.getAllFeedbackPaged).toHaveBeenCalledTimes(3);
    });

    it('toggleHandled flips local state and refreshes unhandled count on success', () => {
        const c = create();
        const fb = makeFeedback({ isHandled: false });

        c.toggleHandled(fb);

        expect(feedbackService.markAsHandled).toHaveBeenCalledWith(1, true);
        expect(fb.isHandled).toBe(true);
        // once from ngOnInit, once after toggle
        expect(feedbackService.getUnhandledCount).toHaveBeenCalledTimes(2);
    });

    it('toggleHandled does nothing without an id', () => {
        const c = create();
        c.toggleHandled(makeFeedback({ id: undefined }));
        expect(feedbackService.markAsHandled).not.toHaveBeenCalled();
    });

    it('deleteFeedback aborts when confirm returns false', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        const c = create();

        c.deleteFeedback(makeFeedback());

        expect(feedbackService.deleteFeedback).not.toHaveBeenCalled();
    });

    it('deleteFeedback calls service and reloads when confirmed', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        const c = create();
        const callsBefore = feedbackService.getAllFeedbackPaged.mock.calls.length;

        c.deleteFeedback(makeFeedback());

        expect(feedbackService.deleteFeedback).toHaveBeenCalledWith(1);
        expect(feedbackService.getAllFeedbackPaged).toHaveBeenCalledTimes(callsBefore + 1);
    });

    it('saveResponse persists value to the feedback object on success', () => {
        const c = create();
        const fb = makeFeedback({ adminResponse: 'old' });
        c.tempResponse = 'new reply';
        c.editingResponseId = 1;

        c.saveResponse(fb);

        expect(feedbackService.updateAdminResponse).toHaveBeenCalledWith(1, 'new reply');
        expect(fb.adminResponse).toBe('new reply');
        expect(c.editingResponseId).toBeNull();
        expect(c.tempResponse).toBe('');
    });

    it('saveResponse shows error snackbar on failure', () => {
        feedbackService.updateAdminResponse.mockReturnValue(throwError(() => new Error('x')));
        const c = create();
        c.tempResponse = 'reply';

        c.saveResponse(makeFeedback());

        expect(snackBar.open).toHaveBeenCalledWith('Kunde inte spara svar', 'Stäng', expect.any(Object));
    });

    it('startEditingResponse and cancelEditingResponse manage temp state', () => {
        const c = create();
        c.startEditingResponse(makeFeedback({ id: 7, adminResponse: 'hej' }));
        expect(c.editingResponseId).toBe(7);
        expect(c.tempResponse).toBe('hej');

        c.cancelEditingResponse();
        expect(c.editingResponseId).toBeNull();
        expect(c.tempResponse).toBe('');
    });

    it('formatDate returns empty string for undefined', () => {
        const c = create();
        expect(c.formatDate(undefined)).toBe('');
        expect(c.formatDate(new Date('2026-01-15T10:00:00Z'))).not.toBe('');
    });

    it('type label and color helpers map correctly', () => {
        const c = create();
        expect(c.getFeedbackTypeLabel(FeedbackType.Improvement)).toBe('Förbättring');
        expect(c.getFeedbackTypeLabel(FeedbackType.Bug)).toBe('Bugg');
        expect(c.getFeedbackTypeColor(FeedbackType.Improvement)).toBe('primary');
        expect(c.getFeedbackTypeColor(FeedbackType.Bug)).toBe('warn');
    });
});
