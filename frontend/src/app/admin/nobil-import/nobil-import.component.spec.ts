/**
 * Surgical coverage for the Leaflet-heavy NobilImportComponent: only
 * filterStations + pagination are tested. Map / DOM / route effects are out of
 * scope per TESTPLAN.md. Component is instantiated directly with mocks to
 * avoid triggering ngOnInit (which builds the Leaflet map).
 */
import { Location } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { NobilDumpStation, NobilService } from '../../services/nobil.service';
import { NobilImportComponent } from './nobil-import.component';

function makeStation(overrides: Partial<NobilDumpStation> = {}): NobilDumpStation {
    return {
        uuid: 1,
        name: 'Station',
        street: '',
        house_number: '',
        zipcode: '',
        city: 'Stockholm',
        municipality: '',
        country_code: 'SWE',
        description: '',
        geolocation: '(59.3,18.0)',
        number_charging_points: 1,
        capacity: 22,
        ...overrides,
    };
}

function create(): NobilImportComponent {
    const nobil = {} as NobilService;
    const snack = {} as MatSnackBar;
    const location = {} as Location;
    const router = {} as Router;
    return new NobilImportComponent(nobil, snack, location, router);
}

describe('NobilImportComponent — filterStations', () => {
    it('filters by name case-insensitively (substring match)', () => {
        const c = create();
        c.stations = [
            makeStation({ uuid: 1, name: 'Ionity Arlanda' }),
            makeStation({ uuid: 2, name: 'Recharge Kista' }),
        ];
        c.filterName = 'ionity';

        c.filterStations();

        expect(c.filteredStations.map(s => s.uuid)).toEqual([1]);
    });

    it('filters by city case-insensitively', () => {
        const c = create();
        c.stations = [
            makeStation({ uuid: 1, city: 'Stockholm' }),
            makeStation({ uuid: 2, city: 'Göteborg' }),
        ];
        c.filterCity = 'GOT';

        c.filterStations();

        // Substring match — 'got' is not in 'göteborg' without diacritics handling,
        // so the explicit lowercase comparison still differentiates. Use a match.
        expect(c.filteredStations).toHaveLength(0);

        c.filterCity = 'stock';
        c.filterStations();
        expect(c.filteredStations.map(s => s.uuid)).toEqual([1]);
    });

    it('combines name, city, and minCapacity filters', () => {
        const c = create();
        c.stations = [
            makeStation({ uuid: 1, name: 'Ionity', city: 'Stockholm', capacity: 50 }),
            makeStation({ uuid: 2, name: 'Ionity', city: 'Stockholm', capacity: 11 }),
            makeStation({ uuid: 3, name: 'Other', city: 'Stockholm', capacity: 50 }),
        ];
        c.filterName = 'ionity';
        c.filterCity = 'stockholm';
        c.minCapacity = 22;

        c.filterStations();

        expect(c.filteredStations.map(s => s.uuid)).toEqual([1]);
    });

    it('treats missing capacity as 0', () => {
        const c = create();
        c.stations = [
            makeStation({ uuid: 1, capacity: undefined as unknown as number }),
            makeStation({ uuid: 2, capacity: 50 }),
        ];
        c.minCapacity = 10;

        c.filterStations();

        expect(c.filteredStations.map(s => s.uuid)).toEqual([2]);
    });

    it('resets pageIndex to 0 after filtering', () => {
        const c = create();
        c.stations = [makeStation()];
        c.pageIndex = 3;

        c.filterStations();

        expect(c.pageIndex).toBe(0);
    });
});

describe('NobilImportComponent — pagedStations', () => {
    it('slices filteredStations by pageIndex and pageSize', () => {
        const c = create();
        c.filteredStations = Array.from({ length: 25 }, (_, i) =>
            makeStation({ uuid: i + 1 }),
        );
        c.pageSize = 10;

        c.pageIndex = 0;
        expect(c.pagedStations.map(s => s.uuid)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

        c.pageIndex = 2;
        expect(c.pagedStations.map(s => s.uuid)).toEqual([21, 22, 23, 24, 25]);
    });

    it('onPageChange updates index and size', () => {
        const c = create();
        c.onPageChange({ pageIndex: 3, pageSize: 50, length: 200 });
        expect(c.pageIndex).toBe(3);
        expect(c.pageSize).toBe(50);
    });
});
