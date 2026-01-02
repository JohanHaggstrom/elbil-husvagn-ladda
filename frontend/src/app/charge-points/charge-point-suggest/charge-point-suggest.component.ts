import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ChargingStationService } from '../../services/charging-station.service';
import { ChargePointBaseComponent } from '../charge-point-base/charge-point-base.component';

@Component({
    selector: 'app-charge-point-suggest',
    standalone: true,
    imports: [CommonModule, ChargePointBaseComponent],
    templateUrl: './charge-point-suggest.component.html'
})
export class ChargePointSuggestComponent {
    private chargingStationService = inject(ChargingStationService);
    private snackBar = inject(MatSnackBar);
    private router = inject(Router);

    async onSubmit(event: { data: any, file: File | null }) {
        try {
            const { id, ...newPoint } = event.data;
            await firstValueFrom(this.chargingStationService.suggestChargingPoint(newPoint, event.file));

            this.snackBar.open('Tack! Ditt förslag har skickats för granskning.', 'Stäng', { duration: 5000 });
            this.router.navigate(['/']);
        } catch (err: any) {
            console.error('Error suggesting charging point:', err);

            // Show specific error message if available
            const errorMessage = err.error?.message || err.error || 'Kunde inte skicka förslag.';
            this.snackBar.open(errorMessage, 'Stäng', { duration: 5000 });
        }
    }

    onCancel() {
        this.router.navigate(['/']);
    }
}
