import { CommonModule, Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ChargingStationService } from '../../services/charging-station.service';
import { ChargePointBaseComponent } from '../charge-point-base/charge-point-base.component';

@Component({
    selector: 'app-charge-point-add',
    standalone: true,
    imports: [CommonModule, ChargePointBaseComponent],
    templateUrl: './charge-point-add.component.html'
})
export class ChargePointAddComponent {
    private chargingStationService = inject(ChargingStationService);
    private snackBar = inject(MatSnackBar);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private location = inject(Location);
    initialData: any = null;

    ngOnInit() {
        // Check for NOBIL data in router state
        const state = window.history.state;
        if (state && state.nobilStation) {
            this.initialData = this.mapNobilToChargingPoint(state.nobilStation);
        }
    }

    private mapNobilToChargingPoint(nobil: any): any {
        // Convert "(lat,long)" to "lat, long"
        let coords = nobil.geolocation || '';
        if (coords.startsWith('(') && coords.endsWith(')')) {
            coords = coords.substring(1, coords.length - 1).replace(',', ', ');
        }

        return {
            title: nobil.name,
            address1: (nobil.street + ' ' + (nobil.house_number || '')).trim(),
            postalCode: nobil.zipcode,
            city: nobil.city,
            country: this.mapCountryCode(nobil.country_code),
            mapCoordinates: coords,
            comments: nobil.description,
            numberOfChargePoints: nobil.number_charging_points,
            externalId: nobil.uuid?.toString(),
            externalSource: 'NOBIL',
            capacity: nobil.capacity || 0
        };
    }

    private mapCountryCode(code: string): string {
        const mapping: { [key: string]: string } = {
            'SWE': 'Sweden',
            'NOR': 'Norway',
            'FIN': 'Finland',
            'DNK': 'Denmark'
        };
        return mapping[code] || 'Sweden';
    }
    async onSubmit(event: { data: any, file: File | null }) {
        try {
            const { id, ...newPoint } = event.data;
            await firstValueFrom(this.chargingStationService.createChargingPoint(newPoint, event.file));

            this.snackBar.open('Laddstation skapad!', 'Stäng', { duration: 3000 });
            this.router.navigate(['..'], { relativeTo: this.route });
        } catch (err: any) {
            console.error('Error creating charging point:', err);

            // Show specific error message if available
            const errorMessage = err.error?.message || err.error || 'Kunde inte skapa laddstation.';
            this.snackBar.open(errorMessage, 'Stäng', { duration: 5000 });
        }
    }

    onCancel() {
        this.location.back();
    }
}
