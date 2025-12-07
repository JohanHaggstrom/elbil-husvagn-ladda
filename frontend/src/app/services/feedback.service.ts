import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Feedback } from '../models/feedback.model';

@Injectable({
    providedIn: 'root'
})
export class FeedbackService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/feedback`;

    private getHeaders() {
        return {
            headers: {
                'X-API-Key': environment.apiKey
            }
        };
    }

    /**
     * Submit feedback - no authentication required
     */
    submitFeedback(feedback: Omit<Feedback, 'id' | 'createdAt'>): Observable<Feedback> {
        return this.http.post<Feedback>(this.apiUrl, feedback, this.getHeaders());
    }

    /**
     * Get all feedback - admin only
     */
    getAllFeedback(): Observable<Feedback[]> {
        return this.http.get<Feedback[]>(this.apiUrl);
    }

    /**
     * Delete feedback - admin only
     */
    deleteFeedback(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /**
     * Mark feedback as handled/unhandled - admin only
     */
    markAsHandled(id: number, isHandled: boolean): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/handle`, isHandled);
    }

    /**
     * Update admin response - admin only
     */
    updateAdminResponse(id: number, response: string): Observable<void> {
        return this.http.patch<void>(`${this.apiUrl}/${id}/response`, JSON.stringify(response), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Get count of unhandled feedback - admin only
     */
    getUnhandledCount(): Observable<number> {
        return this.http.get<number>(`${this.apiUrl}/unhandled/count`);
    }
}
