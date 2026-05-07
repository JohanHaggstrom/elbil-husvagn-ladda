import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PagedResult } from '../models/paged-result.model';

export { PagedResult };

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
    externalId?: string;
    externalSource?: string;
}

export interface SystemVersion {
    backendVersion: string;
    lastMigration: string;
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

    getChargingPointsPaged(page: number, pageSize: number, search?: string): Observable<PagedResult<ChargingPoint>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());
        if (search && search.trim().length > 0) {
            params = params.set('search', search.trim());
        }
        return this.http.get<PagedResult<ChargingPoint>>(this.apiUrl, {
            ...this.getHeaders(),
            params,
        });
    }

    getChargingPoint(id: number): Observable<ChargingPoint> {
        return this.http.get<ChargingPoint>(`${this.apiUrl}/${id}`, this.getHeaders());
    }

    updateChargingPoint(id: number, chargingPoint: ChargingPoint): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, chargingPoint);
    }

    createChargingPoint(chargingPoint: Omit<ChargingPoint, 'id'>, file?: File | null): Observable<ChargingPoint> {
        return this.http.post<ChargingPoint>(this.apiUrl, this.buildFormData(chargingPoint, file));
    }

    private buildFormData(chargingPoint: Omit<ChargingPoint, 'id'>, file?: File | null): FormData {
        const formData = new FormData();

        formData.append('title', chargingPoint.title);
        formData.append('address1', chargingPoint.address1);
        if (chargingPoint.address2) formData.append('address2', chargingPoint.address2);
        formData.append('postalCode', chargingPoint.postalCode);
        formData.append('city', chargingPoint.city);
        formData.append('country', chargingPoint.country);
        if (chargingPoint.comments) formData.append('comments', chargingPoint.comments);
        formData.append('mapCoordinates', chargingPoint.mapCoordinates);
        if (chargingPoint.numberOfChargePoints) formData.append('numberOfChargePoints', chargingPoint.numberOfChargePoints.toString());
        formData.append('capacity', chargingPoint.capacity.toString());
        if (chargingPoint.externalId) formData.append('externalId', chargingPoint.externalId);
        if (chargingPoint.externalSource) formData.append('externalSource', chargingPoint.externalSource);

        if (file) {
            formData.append('image', file);
        }

        return formData;
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

    getSuggestedChargingPointsPaged(page: number, pageSize: number): Observable<PagedResult<ChargingPoint>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('pageSize', pageSize.toString());
        return this.http.get<PagedResult<ChargingPoint>>(this.suggestedApiUrl, {
            ...this.getHeaders(),
            params
        });
    }

    getSuggestedCount(): Observable<number> {
        return this.http.get<number>(`${this.suggestedApiUrl}/count`, this.getHeaders());
    }

    suggestChargingPoint(chargingPoint: Omit<ChargingPoint, 'id'>, file?: File | null): Observable<ChargingPoint> {
        return this.http.post<ChargingPoint>(this.suggestedApiUrl, this.buildFormData(chargingPoint, file), this.getHeaders());
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

    getSystemVersion(): Observable<SystemVersion> {
        return this.http.get<SystemVersion>(`${environment.apiUrl}/api/systeminfo/version`);
    }
}

