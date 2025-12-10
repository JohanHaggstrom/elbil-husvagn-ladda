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
import { AuthService } from '../../auth/auth.service';
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
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private map: L.Map | undefined;
  private marker: L.Marker | undefined;

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  currentImagePath: string | null = null;
  hasImage = false;
  isUploadingImage = false;
  isSuggestion = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditChargingPointDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ChargingPoint | null
  ) {
    this.hasImage = !!data?.hasImage;
    // Determine if this is a suggestion: if not authenticated, OR if specifically passed (future proof)
    this.isSuggestion = !this.authService.isAuthenticated();

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

  // ... (keep integerValidator and other methods same until onSubmit)

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
        if (this.isSuggestion) {
          // Suggestion Mode
          const { id, ...newPoint } = pointData;
          const createdSuggestion = await firstValueFrom(this.chargingStationService.suggestChargingPoint(newPoint)) as ChargingPoint;

          // If there is a file selected, upload it to the suggestion
          if (this.selectedFile && createdSuggestion.id) {
            await firstValueFrom(this.chargingStationService.uploadSuggestionImage(createdSuggestion.id, this.selectedFile));
          }

          this.snackBar.open('Tack! Ditt förslag har skickats för granskning.', 'Stäng', { duration: 5000 });
          this.dialogRef.close(true);
        } else if (this.data && this.data.id) {
          // Update existing
          await firstValueFrom(this.chargingStationService.updateChargingPoint(pointData.id, pointData));
          this.snackBar.open('Laddstation uppdaterad!', 'Stäng', { duration: 3000 });
          this.dialogRef.close(true);
        } else {
          // Create new (Admin)
          const { id, ...newPoint } = pointData;
          const createdPoint = await firstValueFrom(this.chargingStationService.createChargingPoint(newPoint)) as ChargingPoint;

          // If there is a file selected, upload it (but wait, UI for create usually doesn't show file upload until created?
          // actually in this dialog, file upload is separate button that requires ID.
          // But for suggestion I did it in one go above because user can't edit suggestion after.
          // For admin creating, they get the dialog back? No, it closes.
          // Existing logic relied on user creating then editing? Or maybe upload was not available in Create mode?
          // In Create mode (data=null), hasImage is false. The HTML shows upload button?
          // Let's check HTML.
          if (this.selectedFile && createdPoint.id) {
            await firstValueFrom(this.chargingStationService.uploadImage(createdPoint.id, this.selectedFile));
          }

          this.snackBar.open('Laddstation skapad!', 'Stäng', { duration: 3000 });
          this.dialogRef.close(true);
        }
      } catch (err) {
        console.error('Error saving charging point:', err);
        const action = this.isSuggestion ? 'skicka förslag' : (this.data && this.data.id ? 'uppdatera' : 'skapa');
        this.snackBar.open(`Kunde inte ${action}.`, 'Stäng', { duration: 3000 });
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
    if (!this.selectedFile) {
      return;
    }

    // If suggestion mode, we don't upload immediately, we wait for submit?
    // Or if editing existing suggestion? Admin shouldn't edit existing suggestion via this dialog (this is for ChargingPoint).
    // So uploadImage button should logic:
    // If existing point (data.id): upload immediately.
    // If creating/suggesting: Just store selectedFile and upload on Submit.

    if (this.data?.id && !this.isSuggestion) {
      this.isUploadingImage = true;
      try {
        await firstValueFrom(
          this.chargingStationService.uploadImage(this.data.id, this.selectedFile)
        );
        this.hasImage = true;
        this.currentImagePath = 'dummy';
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
