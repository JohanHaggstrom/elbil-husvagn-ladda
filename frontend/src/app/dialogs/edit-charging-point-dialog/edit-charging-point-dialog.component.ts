import { AfterViewInit, Component, Inject, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as L from 'leaflet';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChargingPoint, ChargingStationService } from '../../services/charging-station.service';

@Component({
  selector: 'app-edit-charging-point-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './edit-charging-point-dialog.component.html',
  styleUrl: './edit-charging-point-dialog.component.scss'
})
export class EditChargingPointDialogComponent implements AfterViewInit {
  form: FormGroup;
  private chargingStationService = inject(ChargingStationService);
  private snackBar = inject(MatSnackBar);
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  currentImagePath: string | null = null; // Not used anymore but kept for compatibility if needed, though logic uses hasImage
  hasImage = false;
  isUploadingImage = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditChargingPointDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ChargingPoint | null
  ) {
    this.hasImage = !!data?.hasImage;
    // We can set currentImagePath to something if we want, but we use getImageUrl instead

    this.form = this.fb.group({
      id: [data?.id || 0],
      title: [data?.title || '', Validators.required],
      address1: [data?.address1 || '', Validators.required],
      address2: [data?.address2 || ''],
      postalCode: [data?.postalCode || '', Validators.required],
      city: [data?.city || '', Validators.required],
      country: [data?.country || 'Sweden', Validators.required],
      comments: [data?.comments || ''],
      mapCoordinates: [data?.mapCoordinates || '', Validators.required],
      numberOfChargePoints: [data?.numberOfChargePoints || null, this.integerValidator()],
      capacity: [data?.capacity || null, [Validators.required, this.integerValidator()]]
    });
  }

  private integerValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return null;
      }
      return Number.isInteger(Number(value)) ? null : { notInteger: true };
    };
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    const coords = this.data?.mapCoordinates ? this.parseCoordinates(this.data.mapCoordinates) : null;
    const center: L.LatLngExpression = coords ? coords : [62.0, 15.0]; // Default to center of Sweden if no coords
    const zoom = coords ? 13 : 5;

    this.map = L.map('edit-map').setView(center, zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

    // Use Material Icon for marker
    const iconDefault = L.divIcon({
      className: 'custom-div-icon',
      html: `<span class="material-icons map-marker-icon blue">edit_location</span>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
    L.Marker.prototype.options.icon = iconDefault;

    if (coords) {
      this.marker = L.marker(coords, { draggable: true }).addTo(this.map);

      // Update form when marker is dragged
      this.marker.on('dragend', () => {
        if (this.marker) {
          const position = this.marker.getLatLng();
          this.updateCoordinates(position.lat, position.lng);
        }
      });
    }

    // Update marker and form on map click
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map!);
        this.marker.on('dragend', () => {
          if (this.marker) {
            const position = this.marker.getLatLng();
            this.updateCoordinates(position.lat, position.lng);
          }
        });
      }

      this.updateCoordinates(lat, lng);
    });

    // Invalidate size after a short delay to ensure map renders correctly in dialog
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  private parseCoordinates(coordString: string): [number, number] | null {
    try {
      const parts = coordString.split(',').map(s => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return [parts[0], parts[1]];
      }
    } catch (e) {
      console.error('Failed to parse coordinates:', coordString);
    }
    return null;
  }

  private updateCoordinates(lat: number, lng: number): void {
    const coordString = `${lat}, ${lng}`;
    this.form.patchValue({ mapCoordinates: coordString });
    this.form.markAsDirty();
  }

  async onSubmit(): Promise<void> {
    if (this.form.valid) {
      const pointData = this.form.value;

      try {
        if (this.data && this.data.id) {
          // Update existing
          await firstValueFrom(this.chargingStationService.updateChargingPoint(pointData.id, pointData));
          this.snackBar.open('Laddstation uppdaterad!', 'Stäng', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          // Create new
          // Remove ID from payload for creation
          const { id, ...newPoint } = pointData;
          await firstValueFrom(this.chargingStationService.createChargingPoint(newPoint));
          this.snackBar.open('Laddstation skapad!', 'Stäng', { duration: 3000 });
          this.dialogRef.close(true);
        }
      } catch (err) {
        console.error('Error saving charging point:', err);
        const action = this.data && this.data.id ? 'uppdatera' : 'skapa';
        this.snackBar.open(`Kunde inte ${action} laddstation.`, 'Stäng', { duration: 3000 });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.snackBar.open('Endast JPG, PNG och WebP bilder är tillåtna', 'Stäng', { duration: 3000 });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.snackBar.open('Bilden får max vara 5MB', 'Stäng', { duration: 3000 });
        return;
      }

      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async uploadImage(): Promise<void> {
    if (!this.selectedFile || !this.data?.id) {
      return;
    }

    this.isUploadingImage = true;
    try {
      await firstValueFrom(
        this.chargingStationService.uploadImage(this.data.id, this.selectedFile)
      );
      this.hasImage = true;
      this.currentImagePath = 'dummy'; // Just to trigger UI update if it relies on this, but we should use hasImage
      this.selectedFile = null;
      this.imagePreview = null;
      this.snackBar.open('Bild uppladdad!', 'Stäng', { duration: 2000 });
    } catch (error) {
      console.error('Error uploading image:', error);
      this.snackBar.open('Kunde inte ladda upp bild', 'Stäng', { duration: 3000 });
    } finally {
      this.isUploadingImage = false;
    }
  }

  async deleteImage(): Promise<void> {
    if (!this.data?.id || !this.hasImage) {
      return;
    }

    if (!confirm('Är du säker på att du vill ta bort bilden?')) {
      return;
    }

    try {
      await firstValueFrom(this.chargingStationService.deleteImage(this.data.id));
      this.hasImage = false;
      this.currentImagePath = null;
      this.snackBar.open('Bild borttagen!', 'Stäng', { duration: 2000 });
    } catch (error) {
      console.error('Error deleting image:', error);
      this.snackBar.open('Kunde inte ta bort bild', 'Stäng', { duration: 3000 });
    }
  }

  cancelImageSelection(): void {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  getImageUrl(): string {
    if (this.data?.id) {
      // Add timestamp to prevent caching issues when image is updated
      return `${environment.apiUrl}/api/chargingpoints/${this.data.id}/image?t=${new Date().getTime()}`;
    }
    return '';
  }
}
