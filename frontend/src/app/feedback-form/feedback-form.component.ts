import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { FeedbackType } from '../models/feedback.model';
import { FeedbackService } from '../services/feedback.service';
import { SimpleCaptchaComponent } from '../simple-captcha/simple-captcha.component';

@Component({
    selector: 'app-feedback-form',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        SimpleCaptchaComponent
    ],
    templateUrl: './feedback-form.component.html',
    styleUrl: './feedback-form.component.scss'
})
export class FeedbackFormComponent {
    private feedbackService = inject(FeedbackService);
    private snackBar = inject(MatSnackBar);
    private router = inject(Router);

    feedbackType: FeedbackType = FeedbackType.Improvement;
    title = '';
    description = '';
    email = '';
    isSubmitting = false;
    isCaptchaValid = false;

    FeedbackType = FeedbackType;

    feedbackTypes = [
        { value: FeedbackType.Improvement, label: 'Förbättringsförslag' },
        { value: FeedbackType.Bug, label: 'Buggrapport' }
    ];

    onCaptchaValidChange(isValid: boolean) {
        this.isCaptchaValid = isValid;
    }

    submitFeedback() {
        if (!this.title.trim() || !this.description.trim()) {
            this.snackBar.open('Vänligen fyll i alla obligatoriska fält', 'Stäng', {
                duration: 3000
            });
            return;
        }

        if (!this.isCaptchaValid) {
            this.snackBar.open('Vänligen lös CAPTCHA-frågan korrekt', 'Stäng', {
                duration: 3000
            });
            return;
        }

        this.isSubmitting = true;

        this.feedbackService.submitFeedback({
            type: this.feedbackType,
            title: this.title,
            description: this.description,
            email: this.email.trim() || undefined
        }).subscribe({
            next: () => {
                this.snackBar.open('Tack för din feedback!', 'Stäng', {
                    duration: 3000
                });
                this.resetForm();
                this.router.navigate(['/']);
            },
            error: (error) => {
                console.error('Error submitting feedback:', error);
                this.snackBar.open('Ett fel uppstod. Försök igen senare.', 'Stäng', {
                    duration: 5000
                });
                this.isSubmitting = false;
            }
        });
    }

    resetForm() {
        this.feedbackType = FeedbackType.Improvement;
        this.title = '';
        this.description = '';
        this.email = '';
        this.isSubmitting = false;
        this.isCaptchaValid = false;
    }

    goBack() {
        this.router.navigate(['/']);
    }
}
