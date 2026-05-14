import { provideHttpClient } from '@angular/common/http';
import {
    HttpTestingController,
    provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { ChargingPoint, ChargingStationService } from './charging-station.service';

describe('ChargingStationService', () => {
    let http: HttpTestingController;
    let service: ChargingStationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        http = TestBed.inject(HttpTestingController);
        service = TestBed.inject(ChargingStationService);
    });

    afterEach(() => {
        http.verify();
    });

    describe('getChargingPointsPaged', () => {
        it('omits the search parameter when empty', () => {
            service.getChargingPointsPaged(2, 10).subscribe();

            const req = http.expectOne(r =>
                r.url === `${environment.apiUrl}/api/chargingpoints`,
            );
            expect(req.request.params.get('page')).toBe('2');
            expect(req.request.params.get('pageSize')).toBe('10');
            expect(req.request.params.has('search')).toBe(false);
            req.flush({ items: [], totalCount: 0, page: 2, pageSize: 10 });
        });

        it('trims whitespace-only search to nothing', () => {
            service.getChargingPointsPaged(1, 10, '   ').subscribe();

            const req = http.expectOne(r =>
                r.url === `${environment.apiUrl}/api/chargingpoints`,
            );
            expect(req.request.params.has('search')).toBe(false);
            req.flush({ items: [], totalCount: 0, page: 1, pageSize: 10 });
        });

        it('trims and sends a non-empty search', () => {
            service.getChargingPointsPaged(1, 10, '  hello  ').subscribe();

            const req = http.expectOne(r =>
                r.url === `${environment.apiUrl}/api/chargingpoints`,
            );
            expect(req.request.params.get('search')).toBe('hello');
            req.flush({ items: [], totalCount: 0, page: 1, pageSize: 10 });
        });
    });

    describe('createChargingPoint (buildFormData)', () => {
        const minimal: Omit<ChargingPoint, 'id'> = {
            title: 't',
            address1: 'a1',
            postalCode: '12345',
            city: 'c',
            country: 'SE',
            mapCoordinates: '1,2',
            capacity: 50,
        };

        it('appends only required fields when optional are missing', () => {
            service.createChargingPoint(minimal).subscribe();

            const req = http.expectOne(`${environment.apiUrl}/api/chargingpoints`);
            const fd = req.request.body as FormData;
            expect(fd.get('title')).toBe('t');
            expect(fd.get('address1')).toBe('a1');
            expect(fd.get('capacity')).toBe('50');
            expect(fd.has('address2')).toBe(false);
            expect(fd.has('comments')).toBe(false);
            expect(fd.has('numberOfChargePoints')).toBe(false);
            expect(fd.has('externalId')).toBe(false);
            expect(fd.has('image')).toBe(false);
            req.flush({});
        });

        it('appends optional fields and image when provided', () => {
            const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
            const full: Omit<ChargingPoint, 'id'> = {
                ...minimal,
                address2: 'apt 2',
                comments: 'note',
                numberOfChargePoints: 4,
                externalId: 'ext-1',
                externalSource: 'NOBIL',
            };

            service.createChargingPoint(full, file).subscribe();

            const req = http.expectOne(`${environment.apiUrl}/api/chargingpoints`);
            const fd = req.request.body as FormData;
            expect(fd.get('address2')).toBe('apt 2');
            expect(fd.get('comments')).toBe('note');
            expect(fd.get('numberOfChargePoints')).toBe('4');
            expect(fd.get('externalId')).toBe('ext-1');
            expect(fd.get('externalSource')).toBe('NOBIL');
            expect(fd.get('image')).toBe(file);
            req.flush({});
        });
    });
});
