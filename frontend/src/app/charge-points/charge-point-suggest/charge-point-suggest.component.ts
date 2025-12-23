import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ChargingPoint, ChargingStationService } from '../../services/charging-station.service';
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
            const createdSuggestion = await firstValueFrom(this.chargingStationService.suggestChargingPoint(newPoint)) as ChargingPoint;

            if (event.file && createdSuggestion.id) {
                await firstValueFrom(this.chargingStationService.uploadSuggestionImage(createdSuggestion.id, event.file));
            }

            this.snackBar.open('Tack! Ditt förslag har skickats för granskning.', 'Stäng', { duration: 5000 });
            this.router.navigate(['/']);
        } catch (err) {
            console.error('Error suggesting charging point:', err);
            this.snackBar.open('Kunde inte skicka förslag.', 'Stäng', { duration: 3000 });
        }
    }

    onCancel() {
        this.router.navigate(['/']);
    }
}
