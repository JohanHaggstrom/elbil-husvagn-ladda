import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChargingPoint {
    id: number;
    title: string;
    address1: string;
    address2?: string;
    postalCode: string;
    city: string;
    country: string;
    comments?: string;
    mapCoordinates: string;
    numberOfChargePoints?: number;
    capacity: number;
    hasImage?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class ChargingStationService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/api/chargingpoints`;

    private getHeaders() {
        return {
            headers: {
                'X-API-Key': (window as any).__env?.apiKey || environment.apiKey
            }
        };
    }

    getChargingPoints(): Observable<ChargingPoint[]> {
        return this.http.get<ChargingPoint[]>(this.apiUrl, this.getHeaders());
    }

    getChargingPoint(id: number): Observable<ChargingPoint> {
        return this.http.get<ChargingPoint>(`${this.apiUrl}/${id}`, this.getHeaders());
    }

    updateChargingPoint(id: number, chargingPoint: ChargingPoint): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, chargingPoint);
    }

    createChargingPoint(chargingPoint: Omit<ChargingPoint, 'id'>): Observable<ChargingPoint> {
        return this.http.post<ChargingPoint>(this.apiUrl, chargingPoint);
    }

    deleteChargingPoint(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getHeaders());
    }

    uploadImage(id: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('image', file);
        return this.http.post(`${this.apiUrl}/${id}/image`, formData);
    }

    deleteImage(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}/image`);
    }

    // Suggested Charging Points
    private suggestedApiUrl = `${environment.apiUrl}/api/suggestedchargingpoints`;

    getSuggestedChargingPoints(): Observable<ChargingPoint[]> {
        return this.http.get<ChargingPoint[]>(this.suggestedApiUrl, this.getHeaders());
    }

    getSuggestedCount(): Observable<number> {
        return this.http.get<number>(`${this.suggestedApiUrl}/count`, this.getHeaders());
    }

    suggestChargingPoint(chargingPoint: Omit<ChargingPoint, 'id'>): Observable<ChargingPoint> {
        return this.http.post<ChargingPoint>(this.suggestedApiUrl, chargingPoint, this.getHeaders());
    }

    deleteSuggestedChargingPoint(id: number): Observable<void> {
        return this.http.delete<void>(`${this.suggestedApiUrl}/${id}`, this.getHeaders());
    }

    approveSuggestedChargingPoint(id: number): Observable<ChargingPoint> {
        return this.http.post<ChargingPoint>(`${this.suggestedApiUrl}/${id}/approve`, {}, this.getHeaders());
    }

    uploadSuggestionImage(id: number, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('image', file);
        return this.http.post(`${this.suggestedApiUrl}/${id}/image`, formData, this.getHeaders());
    }
}

