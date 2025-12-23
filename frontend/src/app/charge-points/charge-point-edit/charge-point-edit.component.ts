import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ChargingPoint, ChargingStationService } from '../../services/charging-station.service';
import { ChargePointBaseComponent } from '../charge-point-base/charge-point-base.component';

@Component({
    selector: 'app-charge-point-edit',
    standalone: true,
    imports: [CommonModule, ChargePointBaseComponent],
    templateUrl: './charge-point-edit.component.html'
})
export class ChargePointEditComponent implements OnInit {
    @ViewChild(ChargePointBaseComponent) baseComponent!: ChargePointBaseComponent;

    private chargingStationService = inject(ChargingStationService);
    private snackBar = inject(MatSnackBar);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    chargePointId: number | null = null;
    initialData: Partial<ChargingPoint> | null = null;
    hasImage = false;
    isUploadingImage = false;

    async ngOnInit() {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.chargePointId = +idParam;
            await this.loadChargePoint(this.chargePointId);
        }
    }

    private async loadChargePoint(id: number) {
        try {
            // Replicating original logic: Fetch all and find by ID
            const stations = await firstValueFrom(this.chargingStationService.getChargingPoints());
            const point = stations.find((p: ChargingPoint) => p.id === id);

            if (point) {
                this.initialData = point;
                this.hasImage = !!point.hasImage;
            } else {
                this.snackBar.open('Laddstation hittades inte', 'Stäng', { duration: 3000 });
                this.router.navigate(['/']);
            }
        } catch (e) {
            console.error('Error loading stations', e);
            this.snackBar.open('Kunde inte ladda laddstation', 'Stäng', { duration: 3000 });
        }
    }

    async onSubmit(event: { data: any, file: File | null }) {
        if (!this.chargePointId) return;

        try {
            await firstValueFrom(this.chargingStationService.updateChargingPoint(this.chargePointId, event.data));
            this.snackBar.open('Laddstation uppdaterad!', 'Stäng', { duration: 3000 });
            this.router.navigate(['..'], { relativeTo: this.route });
        } catch (err) {
            console.error('Error updating charging point:', err);
            this.snackBar.open('Kunde inte uppdatera laddstation.', 'Stäng', { duration: 3000 });
        }
    }

    async onUploadImage(file: File) {
        if (!this.chargePointId) return;

        this.isUploadingImage = true;
        try {
            await firstValueFrom(this.chargingStationService.uploadImage(this.chargePointId, file));
            this.hasImage = true;
            this.baseComponent.clearImageSelection(); // Clear the preview/file input
            this.snackBar.open('Bild uppladdad!', 'Stäng', { duration: 2000 });
        } catch (error) {
            console.error('Error uploading image:', error);
            this.snackBar.open('Kunde inte ladda upp bild', 'Stäng', { duration: 3000 });
        } finally {
            this.isUploadingImage = false;
        }
    }

    async onDeleteImage() {
        if (!this.chargePointId || !this.hasImage) return;

        if (!confirm('Är du säker på att du vill ta bort bilden?')) {
            return;
        }

        try {
            await firstValueFrom(this.chargingStationService.deleteImage(this.chargePointId));
            this.hasImage = false;
            this.snackBar.open('Bild borttagen!', 'Stäng', { duration: 2000 });
        } catch (error) {
            console.error('Error deleting image:', error);
            this.snackBar.open('Kunde inte ta bort bild', 'Stäng', { duration: 3000 });
        }
    }

    onCancel() {
        this.router.navigate(['..'], { relativeTo: this.route });
    }
}
