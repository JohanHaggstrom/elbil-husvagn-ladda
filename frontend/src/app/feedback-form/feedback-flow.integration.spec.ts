/**
 * Step 5 integration test: feedback submission with the real FeedbackService
 * wired against HttpTestingController. Verifies the form-to-HTTP wiring that
 * unit tests with a mocked service cannot.
 */
import { provideHttpClient } from '@angular/common/http';
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { FeedbackType } from '../models/feedback.model';
import { FeedbackFormComponent } from './feedback-form.component';

describe('Feedback submit flow (integration)', () => {
    let http: HttpTestingController;
    let router: { navigate: ReturnType<typeof vi.fn> };
    let snackBar: { open: ReturnType<typeof vi.fn> };

    beforeEach(() => {
        router = { navigate: vi.fn() };
        snackBar = { open: vi.fn() };

        TestBed.configureTestingModule({
            imports: [FeedbackFormComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: Router, useValue: router },
                { provide: MatSnackBar, useValue: snackBar },
            ],
        });
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        http.verify();
    });

    it('POSTs valid feedback to /api/feedback and shows confirmation', () => {
        const c = TestBed.createComponent(FeedbackFormComponent).componentInstance;
        c.title = 'Bug A';
        c.description = 'Steps...';
        c.email = 'me@example.com';
        c.feedbackType = FeedbackType.Bug;
        c.isCaptchaValid = true;

        c.submitFeedback();

        const req = http.expectOne(`${environment.apiUrl}/api/feedback`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({
            type: FeedbackType.Bug,
            title: 'Bug A',
            description: 'Steps...',
            email: 'me@example.com',
        });
        req.flush({ id: 99 });

        expect(snackBar.open).toHaveBeenCalledWith(
            'Tack för din feedback!',
            'Stäng',
            expect.any(Object),
        );
        expect(router.navigate).toHaveBeenCalledWith(['/']);
        expect(c.title).toBe('');
    });

    it('does not call the backend when captcha is missing', () => {
        const c = TestBed.createComponent(FeedbackFormComponent).componentInstance;
        c.title = 'X';
        c.description = 'Y';
        c.isCaptchaValid = false;

        c.submitFeedback();

        http.expectNone(`${environment.apiUrl}/api/feedback`);
    });
});
