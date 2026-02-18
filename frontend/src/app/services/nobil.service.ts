import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NobilDumpStation {
    uuid: number;
    name: string;
    street: string;
    house_number: string;
    zipcode: string;
    city: string;
    municipality: string;
    country_code: string;
    description: string;
    geolocation: string; // "(lat,long)"
    number_charging_points: number;
}

@Injectable({
    providedIn: 'root'
})
export class NobilService {
    private apiUrl = `${environment.apiUrl}/api/nobil`;

    constructor(private http: HttpClient) { }

    private getHeaders() {
        return {
            headers: {
                'X-API-Key': (window as any).__env?.apiKey || environment.apiKey
            }
        };
    }

    searchStations(countryCode: string = 'SWE'): Observable<NobilDumpStation[]> {
        return this.http.get<NobilDumpStation[]>(`${this.apiUrl}/search?countryCode=${countryCode}`, this.getHeaders());
    }

    importStation(station: NobilDumpStation): Observable<any> {
        return this.http.post(`${this.apiUrl}/import`, station, this.getHeaders());
    }

    ignoreStation(externalId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/ignore`, { externalId }, this.getHeaders());
    }

    getMatches(countryCode: string = 'SWE'): Observable<NobilStationMatch[]> {
        return this.http.get<NobilStationMatch[]>(`${this.apiUrl}/matches?countryCode=${countryCode}`, this.getHeaders());
    }

    linkStation(localId: number, nobilId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/link`, { localId, nobilId }, this.getHeaders());
    }
}

export interface NobilStationMatch {
    localStation: any; // Ideally typed as ChargingPoint
    nobilStation: NobilDumpStation;
    distanceMeters: number;
}
