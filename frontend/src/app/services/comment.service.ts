import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChargePointComment, CreateCommentRequest } from '../models/comment.model';

@Injectable({
    providedIn: 'root'
})
export class CommentService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/chargingpoints`;

    private getHeaders() {
        return {
            headers: {
                'X-API-Key': (window as any).__env?.apiKey || environment.apiKey
            }
        };
    }

    getComments(chargePointId: number): Observable<ChargePointComment[]> {
        return this.http.get<ChargePointComment[]>(`${this.apiUrl}/${chargePointId}/comments`, this.getHeaders());
    }

    createComment(chargePointId: number, request: CreateCommentRequest): Observable<ChargePointComment> {
        return this.http.post<ChargePointComment>(`${this.apiUrl}/${chargePointId}/comments`, request, this.getHeaders());
    }

    deleteComment(chargePointId: number, commentId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${chargePointId}/comments/${commentId}`, this.getHeaders());
    }
}
