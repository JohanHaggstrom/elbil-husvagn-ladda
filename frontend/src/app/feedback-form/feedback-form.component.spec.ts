import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FeedbackType } from '../models/feedback.model';
import { FeedbackService } from '../services/feedback.service';
import { FeedbackFormComponent } from './feedback-form.component';

describe('FeedbackFormComponent', () => {
    let feedback: { submitFeedback: ReturnType<typeof vi.fn> };
    let router: { navigate: ReturnType<typeof vi.fn> };
    let snackBar: { open: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        feedback = { submitFeedback: vi.fn() };
        router = { navigate: vi.fn() };
        snackBar = { open: vi.fn() };

        TestBed.configureTestingModule({
            imports: [FeedbackFormComponent],
            providers: [
                { provide: FeedbackService, useValue: feedback },
                { provide: Router, useValue: router },
                { provide: MatSnackBar, useValue: snackBar },
            ],
        });

        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function create(): FeedbackFormComponent {
        return TestBed.createComponent(FeedbackFormComponent).componentInstance;
    }

    function fill(c: FeedbackFormComponent): void {
        c.title = 'title';
        c.description = 'desc';
        c.isCaptchaValid = true;
    }

    it('rejects submit when title is blank', () => {
        const c = create();
        fill(c);
        c.title = '   ';

        c.submitFeedback();

        expect(feedback.submitFeedback).not.toHaveBeenCalled();
        expect(snackBar.open).toHaveBeenCalledWith(
            'Vänligen fyll i alla obligatoriska fält',
            'Stäng',
            expect.any(Object),
        );
    });

    it('rejects submit when description is blank', () => {
        const c = create();
        fill(c);
        c.description = '';

        c.submitFeedback();

        expect(feedback.submitFeedback).not.toHaveBeenCalled();
    });

    it('rejects submit when captcha is invalid', () => {
        const c = create();
        fill(c);
        c.isCaptchaValid = false;

        c.submitFeedback();

        expect(feedback.submitFeedback).not.toHaveBeenCalled();
        expect(snackBar.open).toHaveBeenCalledWith(
            'Vänligen lös reCAPTCHA',
            'Stäng',
            expect.any(Object),
        );
    });

    it('sends email as undefined when blank, navigates home and resets on success', () => {
        feedback.submitFeedback.mockReturnValue(of({}));
        const c = create();
        fill(c);
        c.email = '   ';
        c.feedbackType = FeedbackType.Bug;

        c.submitFeedback();

        expect(feedback.submitFeedback).toHaveBeenCalledWith({
            type: FeedbackType.Bug,
            title: 'title',
            description: 'desc',
            email: undefined,
        });
        expect(router.navigate).toHaveBeenCalledWith(['/']);
        expect(c.title).toBe('');
        expect(c.isSubmitting).toBe(false);
    });

    it('trims and sends email when present', () => {
        feedback.submitFeedback.mockReturnValue(of({}));
        const c = create();
        fill(c);
        c.email = '  a@b.se  ';

        c.submitFeedback();

        expect(feedback.submitFeedback).toHaveBeenCalledWith(expect.objectContaining({
            email: 'a@b.se',
        }));
    });

    it('shows error and resets isSubmitting on failure', () => {
        feedback.submitFeedback.mockReturnValue(throwError(() => new Error('x')));
        const c = create();
        fill(c);

        c.submitFeedback();

        expect(router.navigate).not.toHaveBeenCalled();
        expect(snackBar.open).toHaveBeenCalledWith(
            'Ett fel uppstod. Försök igen senare.',
            'Stäng',
            expect.any(Object),
        );
        expect(c.isSubmitting).toBe(false);
    });

    it('onResolved tracks captcha response presence', () => {
        const c = create();
        c.onResolved('token');
        expect(c.isCaptchaValid).toBe(true);
        c.onResolved(null);
        expect(c.isCaptchaValid).toBe(false);
    });
});
