import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import * as L from 'leaflet';
import { environment } from '../../../environments/environment';
import { ChargingPoint } from '../../services/charging-station.service';

@Component({
    selector: 'app-charge-point-base',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatIconModule,
        MatTooltipModule
    ],
    templateUrl: './charge-point-base.component.html',
    styleUrl: './charge-point-base.component.scss'
})
export class ChargePointBaseComponent implements OnInit, OnChanges, AfterViewInit {
    @Input() initialData: Partial<ChargingPoint> | null = null;
    @Input() title: string = 'Laddstation';
    @Input() submitLabel: string = 'Spara';
    @Input() showInstantImageUpload: boolean = false;
    @Input() isUploadingImage: boolean = false;
    @Input() chargePointId: number | null = null; // Needed for current image URL
    @Input() hasImage: boolean = false;

    @Output() formSubmit = new EventEmitter<{ data: any, file: File | null }>();
    @Output() uploadImage = new EventEmitter<File>();
    @Output() deleteImage = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    form: FormGroup;
    private snackBar = inject(MatSnackBar);

    private map: L.Map | undefined;
    private marker: L.Marker | undefined;

    selectedFile: File | null = null;
    imagePreview: string | null = null;
    currentImagePath: string | null = null;

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            id: [0],
            title: ['', Validators.required],
            address1: ['', Validators.required],
            address2: [''],
            postalCode: ['', Validators.required],
            city: ['', Validators.required],
            country: ['Sweden', Validators.required],
            comments: [''],
            mapCoordinates: ['', Validators.required],
            numberOfChargePoints: [null, this.integerValidator()],
            capacity: [null, [Validators.required, this.integerValidator()]]
        });
    }

    ngOnInit() {
        if (this.initialData) {
            this.patchForm(this.initialData);
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['initialData'] && changes['initialData'].currentValue) {
            this.patchForm(changes['initialData'].currentValue);
        }
    }

    ngAfterViewInit(): void {
        this.initMap();
    }

    private patchForm(data: Partial<ChargingPoint>) {
        this.form.patchValue({
            id: data.id,
            title: data.title,
            address1: data.address1,
            address2: data.address2,
            postalCode: data.postalCode,
            city: data.city,
            country: data.country,
            comments: data.comments,
            mapCoordinates: data.mapCoordinates,
            numberOfChargePoints: data.numberOfChargePoints,
            capacity: data.capacity
        });

        // Update map if it is already initialized (e.g. if initialData comes late) or if we init later it will pick up form value
        if (this.map && data.mapCoordinates) {
            // This might be redundant if map inits after this, but good if data updates later
            const coords = this.parseCoordinates(data.mapCoordinates);
            if (coords) {
                this.updateMapMarker(coords[0], coords[1]);
                this.map.setView(coords, 13);
            }
        }
    }

    private integerValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = control.value;
            if (value === null || value === undefined || value === '') {
                return null; // Let required validator handle empty
            }
            return Number.isInteger(Number(value)) ? null : { notInteger: true };
        };
    }

    private initMap(): void {
        const currentCoords = this.form.get('mapCoordinates')?.value;
        const coords = currentCoords ? this.parseCoordinates(currentCoords) : null;
        const center: L.LatLngExpression = coords ? coords : [62.0, 15.0];
        const zoom = coords ? 13 : 5;

        this.map = L.map('edit-map').setView(center, zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);

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
            this.setupMarkerEvents();
        }

        this.map.on('click', (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;
            this.updateMapMarker(lat, lng);
            this.updateCoordinates(lat, lng);
        });

        setTimeout(() => {
            this.map?.invalidateSize();
        }, 100);
    }

    private updateMapMarker(lat: number, lng: number) {
        if (this.marker) {
            this.marker.setLatLng([lat, lng]);
        } else {
            this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map!);
            this.setupMarkerEvents();
        }
    }

    private setupMarkerEvents() {
        if (!this.marker) return;
        this.marker.on('dragend', () => {
            if (this.marker) {
                const position = this.marker.getLatLng();
                this.updateCoordinates(position.lat, position.lng);
            }
        });
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

    onSubmit(): void {
        if (this.form.valid) {
            this.formSubmit.emit({
                data: this.form.value,
                file: this.selectedFile
            });
        }
    }

    onCancel(): void {
        this.cancel.emit();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                this.snackBar.open('Endast JPG, PNG och WebP bilder är tillåtna', 'Stäng', { duration: 3000 });
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                this.snackBar.open('Bilden får max vara 5MB', 'Stäng', { duration: 3000 });
                return;
            }
            this.selectedFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.imagePreview = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    triggerUploadImage(): void {
        if (this.selectedFile) {
            this.uploadImage.emit(this.selectedFile);
        }
    }

    triggerDeleteImage(): void {
        this.deleteImage.emit();
    }

    // Method to clear local preview after successful upload
    clearImageSelection(): void {
        this.selectedFile = null;
        this.imagePreview = null;
    }

    cancelImageSelection(): void {
        this.selectedFile = null;
        this.imagePreview = null;
    }

    getImageUrl(): string {
        if (this.chargePointId) {
            return `${environment.apiUrl}/api/chargingpoints/${this.chargePointId}/image?t=${new Date().getTime()}`;
        }
        return '';
    }
}
