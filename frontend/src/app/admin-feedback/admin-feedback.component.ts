import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Feedback, FeedbackType } from '../models/feedback.model';
import { FeedbackService } from '../services/feedback.service';

@Component({
    selector: 'app-admin-feedback',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatTooltipModule
    ],
    templateUrl: './admin-feedback.component.html',
    styleUrl: './admin-feedback.component.scss'
})
export class AdminFeedbackComponent implements OnInit {
    private feedbackService = inject(FeedbackService);
    private snackBar = inject(MatSnackBar);
    private router = inject(Router);
    authService = inject(AuthService);

    feedbacks: Feedback[] = [];
    isLoading = false;
    FeedbackType = FeedbackType;
    editingResponseId: number | null = null;
    tempResponse = '';

    ngOnInit() {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }
        this.loadFeedback();
    }

    loadFeedback() {
        this.isLoading = true;
        this.feedbackService.getAllFeedback().subscribe({
            next: (feedbacks) => {
                this.feedbacks = feedbacks;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading feedback:', error);
                this.snackBar.open('Kunde inte ladda feedback', 'Stäng', {
                    duration: 3000
                });
                this.isLoading = false;
            }
        });
    }

    deleteFeedback(feedback: Feedback) {
        if (!feedback.id) return;

        if (!confirm(`Är du säker på att du vill ta bort "${feedback.title}"?`)) {
            return;
        }

        this.feedbackService.deleteFeedback(feedback.id).subscribe({
            next: () => {
                this.feedbacks = this.feedbacks.filter(f => f.id !== feedback.id);
                this.snackBar.open('Feedback borttagen', 'Stäng', {
                    duration: 3000
                });
            },
            error: (error) => {
                console.error('Error deleting feedback:', error);
                this.snackBar.open('Kunde inte ta bort feedback', 'Stäng', {
                    duration: 3000
                });
            }
        });
    }

    toggleHandled(feedback: Feedback) {
        if (!feedback.id) return;

        const newStatus = !feedback.isHandled;
        this.feedbackService.markAsHandled(feedback.id, newStatus).subscribe({
            next: () => {
                feedback.isHandled = newStatus;
                this.snackBar.open(
                    newStatus ? 'Markerad som hanterad' : 'Markerad som ohanterad',
                    'Stäng',
                    { duration: 2000 }
                );
            },
            error: (error) => {
                console.error('Error updating feedback status:', error);
                this.snackBar.open('Kunde inte uppdatera status', 'Stäng', {
                    duration: 3000
                });
            }
        });
    }

    startEditingResponse(feedback: Feedback) {
        this.editingResponseId = feedback.id || null;
        this.tempResponse = feedback.adminResponse || '';
    }

    cancelEditingResponse() {
        this.editingResponseId = null;
        this.tempResponse = '';
    }

    saveResponse(feedback: Feedback) {
        if (!feedback.id) return;

        this.feedbackService.updateAdminResponse(feedback.id, this.tempResponse).subscribe({
            next: () => {
                feedback.adminResponse = this.tempResponse;
                this.editingResponseId = null;
                this.tempResponse = '';
                this.snackBar.open('Svar sparat', 'Stäng', {
                    duration: 2000
                });
            },
            error: (error) => {
                console.error('Error saving response:', error);
                this.snackBar.open('Kunde inte spara svar', 'Stäng', {
                    duration: 3000
                });
            }
        });
    }

    getFeedbackTypeLabel(type: FeedbackType): string {
        return type === FeedbackType.Improvement ? 'Förbättring' : 'Bugg';
    }

    getFeedbackTypeColor(type: FeedbackType): string {
        return type === FeedbackType.Improvement ? 'primary' : 'warn';
    }

    formatDate(date: Date | undefined): string {
        if (!date) return '';
        return new Date(date).toLocaleString('sv-SE');
    }

    goBack() {
        this.router.navigate(['/']);
    }

    get unhandledCount(): number {
        return this.feedbacks.filter(f => !f.isHandled).length;
    }
}
