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
import type { LatLngExpression, LeafletMouseEvent, Map, Marker } from 'leaflet';
import { RecaptchaModule } from 'ng-recaptcha-2';
import { environment } from '../../../environments/environment';
import { ImageConstants } from '../../models/image-settings.model';
import { ChargingPoint } from '../../services/charging-station.service';
import { ImageCompressorService } from '../../services/image-compressor.service';
declare var L: any;

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
        MatTooltipModule,
        RecaptchaModule
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
    @Input() showCaptcha: boolean = false;

    @Output() formSubmit = new EventEmitter<{ data: any, file: File | null }>();
    @Output() uploadImage = new EventEmitter<File>();
    @Output() deleteImage = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    form: FormGroup;
    private snackBar = inject(MatSnackBar);

    private map: Map | undefined;
    private marker: Marker | undefined;

    selectedFile: File | null = null;
    imagePreview: string | null = null;
    currentImagePath: string | null = null;
    isCaptchaSolved: boolean = false;

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
        const center: LatLngExpression = coords ? coords : [62.0, 15.0];
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

        this.map?.on('click', (e: LeafletMouseEvent) => {
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
        if (this.canSubmit) {
            this.formSubmit.emit({
                data: this.form.value,
                file: this.selectedFile
            });
        }
    }

    onResolved(captchaResponse: string | null) {
        this.isCaptchaSolved = !!captchaResponse;
    }

    get canSubmit(): boolean {
        return this.form.valid && (!this.showCaptcha || this.isCaptchaSolved);
    }

    onCancel(): void {
        this.cancel.emit();
    }

    private imageCompressor = inject(ImageCompressorService);

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];

            if (!ImageConstants.ALLOWED_TYPES.includes(file.type)) {
                this.snackBar.open('Endast JPG, PNG och WebP bilder är tillåtna', 'Stäng', { duration: 3000 });
                return;
            }
            // Allow larger initial files knowing we will compress them
            const maxInputBytes = ImageConstants.MAX_INPUT_SIZE_MB * 1024 * 1024;
            if (file.size > maxInputBytes) {
                this.snackBar.open(`Bilden får max vara ${ImageConstants.MAX_INPUT_SIZE_MB}MB`, 'Stäng', { duration: 3000 });
                return;
            }

            this.snackBar.open('Bearbetar bild...', '', { duration: 1000 });

            this.imageCompressor.compressImage(
                file,
                ImageConstants.MAX_WIDTH,
                ImageConstants.MAX_HEIGHT,
                ImageConstants.COMPRESSION_QUALITY
            )
                .then((compressedFile: File) => {
                    this.selectedFile = compressedFile;
                    // Check size again after compression just in case
                    const maxUploadBytes = ImageConstants.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
                    if (this.selectedFile.size > maxUploadBytes) {
                        this.snackBar.open('Bilden är fortfarande för stor efter komprimering. Försök med en mindre bild.', 'Stäng', { duration: 4000 });
                        this.selectedFile = null;
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.imagePreview = e.target?.result as string;
                    };
                    reader.readAsDataURL(this.selectedFile);
                })
                .catch((err: unknown) => {
                    console.error('Image compression failed', err);
                    this.snackBar.open('Kunde inte bearbeta bilden', 'Stäng', { duration: 3000 });
                });
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
