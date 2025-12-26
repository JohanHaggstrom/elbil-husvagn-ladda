import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class BackupService {
    private http = inject(HttpClient);

    private getHeaders() {
        return {
            headers: {
                'X-API-Key': (window as any).__env?.apiKey || environment.apiKey,
            },
        };
    }

    exportChargingPoints() {
        const url = `${environment.apiUrl}/api/backup/export`;
        return this.http.get(url, {
            responseType: 'blob',
            ...this.getHeaders(),
        });
    }
}
