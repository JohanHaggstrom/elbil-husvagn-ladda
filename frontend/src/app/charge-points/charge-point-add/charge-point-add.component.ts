import { CommonModule } from '@angular/common';
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
        this.router.navigate(['..'], { relativeTo: this.route });
    }
}
