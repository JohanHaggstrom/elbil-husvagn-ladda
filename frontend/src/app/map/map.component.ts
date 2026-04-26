import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
    AfterViewInit,
    ApplicationRef,
    Component,
    ComponentRef,
    createComponent,
    DestroyRef,
    EnvironmentInjector,
    EventEmitter,
    inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { IdentifiedCaravanChargePoint } from '../app.model';
import { AuthService } from '../auth/auth.service';
import { ErrorService } from '../services/error.service';
import { ShareService } from '../services/share.service';
import { ChargePointPopupComponent } from './charge-point-popup/charge-point-popup.component';

import type { DivIcon, Map as LeafletMap, Marker, TileLayer } from 'leaflet';
declare var L: any;

@Component({
    selector: 'app-map',
    imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatTooltipModule],
    templateUrl: './map.component.html',
    styleUrl: './map.component.scss',
})
export class MapComponent
    implements OnInit, AfterViewInit, OnChanges, OnDestroy {
    @Input() chargePoints: IdentifiedCaravanChargePoint[] = [];
    @Output() chargePointSelected =
        new EventEmitter<IdentifiedCaravanChargePoint>();
    @Output() editChargePoint =
        new EventEmitter<IdentifiedCaravanChargePoint>();
    @Output() deleteChargePoint =
        new EventEmitter<IdentifiedCaravanChargePoint>();
    @Output() viewComments = new EventEmitter<IdentifiedCaravanChargePoint>();

    private map: LeafletMap | null = null;
    private markerClusterGroup: any = null;
    private userLocationMarker: Marker | null = null;
    private http = inject(HttpClient);
    private errorService = inject(ErrorService);
    private snackBar = inject(MatSnackBar);
    public authService = inject(AuthService);
    public shareService = inject(ShareService);
    private appRef = inject(ApplicationRef);
    private injector = inject(EnvironmentInjector);
    private destroyRef = inject(DestroyRef);
    private markersById = new Map<
        number,
        {
            marker: Marker;
            snapshot: string;
            popupRef: ComponentRef<ChargePointPopupComponent> | null;
        }
    >();

    public searchQuery: string = '';
    public searchResults: any[] = [];
    public isSearching: boolean = false;
    private lastSearchAt: number = 0;
    private static readonly NOMINATIM_MIN_INTERVAL_MS = 1000;
    public isSatelliteMode: boolean = false;
    private osmLayer: TileLayer | null = null;
    private satelliteLayer: TileLayer | null = null;

    // Mobile fullscreen popup
    public showMobilePopup: boolean = false;
    public mobilePopupChargePoint: IdentifiedCaravanChargePoint | null = null;
    public get isMobile(): boolean {
        return window.innerWidth < 768;
    }

    ngOnInit(): void {
        // Fix for default marker icons in Leaflet with webpack
        // Set default marker icon to Material Icon
        const iconDefault = L.divIcon({
            className: 'custom-div-icon',
            html: `<span class="material-icons map-marker-icon blue">location_on</span>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40],
        });
        L.Marker.prototype.options.icon = iconDefault;
    }

    ngAfterViewInit(): void {
        this.initMap();
        this.addMarkers();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['chargePoints']) {
            if (this.map && this.markerClusterGroup) {
                this.addMarkers();
            }
        }
    }

    ngOnDestroy(): void {
        this.removeAllMarkers();
        if (this.map) {
            this.map.remove();
        }
    }

    private removeAllMarkers(): void {
        for (const id of Array.from(this.markersById.keys())) {
            this.removeMarker(id);
        }
    }

    private removeMarker(id: number): void {
        const entry = this.markersById.get(id);
        if (!entry) return;
        if (this.markerClusterGroup) {
            this.markerClusterGroup.removeLayer(entry.marker);
        }
        entry.popupRef?.destroy();
        this.markersById.delete(id);
    }

    private initMap(): void {
        // Center map on Sweden (approximately)
        this.map = L.map('map', {
            center: [62.0, 15.0],
            zoom: 5,
            tap: false, // Disable Leaflet tap handler (fixes mobile issues)
            closePopupOnClick: false, // Don't close popup when map is clicked
        });

        // Add OpenStreetMap tiles
        this.osmLayer = L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                maxZoom: 19,
                attribution:
                    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }
        );
        if (this.osmLayer && this.map) {
            this.osmLayer.addTo(this.map);
        }

        // Add satellite layer (USGS Satellite)
        this.satelliteLayer = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                maxZoom: 19,
                attribution: '&copy; Esri, DigitalGlobe, Earthstar Geographics',
            }
        );

        // Initialize marker cluster group
        this.markerClusterGroup = (L as any).markerClusterGroup({
            chunkedLoading: true,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
        });
        if (this.map && this.markerClusterGroup) {
            this.map.addLayer(this.markerClusterGroup);
        }

        // Hide controls when popup is open (for better mobile visibility)
        if (this.map) {
            this.map.on('popupopen', () => {
                const mapContainer = document.querySelector('.map-container');
                if (mapContainer) {
                    mapContainer.classList.add('popup-open');
                }
            });

            this.map.on('popupclose', () => {
                const mapContainer = document.querySelector('.map-container');
                if (mapContainer) {
                    mapContainer.classList.remove('popup-open');
                }
            });
        }
    }

    private addMarkers(): void {
        if (!this.map || !this.markerClusterGroup) {
            return;
        }

        const wasEmpty = this.markersById.size === 0;
        const incomingIds = new Set<number>();
        let changed = false;

        for (const point of this.chargePoints) {
            incomingIds.add(point.id);
            const snapshot = JSON.stringify(point);
            const existing = this.markersById.get(point.id);

            if (existing && existing.snapshot === snapshot) {
                continue;
            }

            if (existing) {
                this.removeMarker(point.id);
            }

            if (this.createAndAddMarker(point, snapshot)) {
                changed = true;
            }
        }

        for (const id of Array.from(this.markersById.keys())) {
            if (!incomingIds.has(id)) {
                this.removeMarker(id);
                changed = true;
            }
        }

        // Fit bounds when initially populating, mirroring previous behavior.
        if (changed && wasEmpty && this.markerClusterGroup.getLayers().length > 0) {
            const bounds = this.markerClusterGroup.getBounds();
            this.map.fitBounds(bounds.pad(0.1));
        }
    }

    private createAndAddMarker(
        point: IdentifiedCaravanChargePoint,
        snapshot: string
    ): boolean {
        const coords = this.parseCoordinates(point.mapCoordinates);
        if (!coords || !this.markerClusterGroup) {
            return false;
        }

        const icon = this.getMarkerIcon(point.capacity);
        const marker = L.marker(coords, { icon });

        marker.on('click', () => {
            if (this.isMobile) {
                this.showMobilePopup = true;
                this.mobilePopupChargePoint = point;
                this.chargePointSelected.emit(point);
                this.map?.closePopup();
            } else {
                this.chargePointSelected.emit(point);
                this.closeMobilePopup();
            }
        });

        let popupRef: ComponentRef<ChargePointPopupComponent> | null = null;
        if (!this.isMobile) {
            const { domElem, componentRef } = this.createPopupContent(point);
            popupRef = componentRef;
            marker.bindPopup(domElem, {
                autoPan: false,
                maxWidth: 300,
            });
        }

        this.markerClusterGroup.addLayer(marker);
        this.markersById.set(point.id, { marker, snapshot, popupRef });
        return true;
    }

    private getMarkerIcon(capacity: number): DivIcon {
        let colorClass: string;

        // Color code based on capacity
        if (capacity > 200) {
            colorClass = 'green'; // High capacity (> 200 kW)
        } else if (capacity >= 100) {
            colorClass = 'yellow'; // Medium capacity (100-200 kW)
        } else {
            colorClass = 'red'; // Low capacity (< 100 kW)
        }

        return L.divIcon({
            className: 'custom-div-icon',
            html: `<span class="material-icons map-marker-icon ${colorClass}">location_on</span>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40],
        });
    }

    private parseCoordinates(coordString: string): [number, number] | null {
        try {
            const parts = coordString
                .split(',')
                .map((s) => parseFloat(s.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                return [parts[0], parts[1]];
            }
        } catch (e) {
            console.error('Failed to parse coordinates:', coordString);
        }
        return null;
    }

    private createPopupContent(point: IdentifiedCaravanChargePoint): {
        domElem: HTMLElement;
        componentRef: ComponentRef<ChargePointPopupComponent>;
    } {
        const componentRef = createComponent(ChargePointPopupComponent, {
            environmentInjector: this.injector,
        });

        componentRef.instance.chargePoint = point;
        componentRef.instance.isAuthenticated =
            this.authService.isAuthenticated();

        // Subscriptions are released when the componentRef is destroyed
        // (in removeMarker / removeAllMarkers), or if the MapComponent itself
        // is destroyed first via takeUntilDestroyed.
        const untilDestroyed = takeUntilDestroyed(this.destroyRef);
        componentRef.instance.edit.pipe(untilDestroyed).subscribe(() => {
            this.editChargePoint.emit(point);
        });

        componentRef.instance.delete.pipe(untilDestroyed).subscribe(() => {
            this.deleteChargePoint.emit(point);
            this.map?.closePopup();
        });

        componentRef.instance.viewComments.pipe(untilDestroyed).subscribe(() => {
            this.viewComments.emit(point);
        });

        this.appRef.attachView(componentRef.hostView);

        const domElem = (componentRef.hostView as any)
            .rootNodes[0] as HTMLElement;

        return { domElem, componentRef };
    }

    public showUserLocation(): void {
        if (!this.map) return;

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const userCoords: [number, number] = [latitude, longitude];

                    // Remove existing user location marker
                    if (this.userLocationMarker) {
                        this.userLocationMarker.remove();
                    }

                    // Create custom icon for user location
                    const userIcon = L.divIcon({
                        className: 'custom-div-icon',
                        html: '<span class="material-icons user-location-icon">my_location</span>',
                        iconSize: [24, 24],
                        iconAnchor: [12, 12],
                    });

                    // Add marker for user location
                    this.userLocationMarker = L.marker(userCoords, {
                        icon: userIcon,
                    })
                        .addTo(this.map!)
                        .bindPopup('Din position')
                        .openPopup();

                    // Center map on user location
                    this.map!.setView(userCoords, 12);
                },
                (error) => {
                    this.errorService.handleError(
                        error,
                        'Kunde inte hämta din position. Kontrollera att du har gett tillåtelse för platsåtkomst.'
                    );
                }
            );
        } else {
            this.snackBar.open(
                'Geolocation stöds inte av din webbläsare.',
                'Stäng',
                { duration: 5000 }
            );
        }
    }
    public async searchLocation(): Promise<void> {
        if (!this.searchQuery || this.searchQuery.length < 3) return;
        if (this.isSearching) return;

        const sinceLast = Date.now() - this.lastSearchAt;
        if (sinceLast < MapComponent.NOMINATIM_MIN_INTERVAL_MS) {
            await new Promise((resolve) =>
                setTimeout(resolve, MapComponent.NOMINATIM_MIN_INTERVAL_MS - sinceLast)
            );
        }

        this.isSearching = true;
        this.lastSearchAt = Date.now();
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            this.searchQuery
        )}`;

        try {
            const results = await firstValueFrom(this.http.get<any[]>(url));
            this.isSearching = false;
            if (results && results.length > 0) {
                const firstResult = results[0];
                const lat = parseFloat(firstResult.lat);
                const lon = parseFloat(firstResult.lon);

                if (this.map) {
                    this.map.setView([lat, lon], 12);
                }
                this.searchResults = []; // Clear results after selection (or handle list if we want to show multiple)
            } else {
                this.snackBar.open('Inga platser hittades.', 'Stäng', {
                    duration: 5000,
                });
            }
        } catch (err) {
            this.isSearching = false;
            this.errorService.handleError(err, 'Ett fel uppstod vid sökning.');
        }
    }

    toggleSatelliteMode(): void {
        if (!this.map) return;

        if (this.isSatelliteMode) {
            // Switch back to OSM
            if (this.satelliteLayer) {
                this.map.removeLayer(this.satelliteLayer);
            }
            if (this.osmLayer) {
                this.map.addLayer(this.osmLayer);
            }
            this.isSatelliteMode = false;
        } else {
            // Switch to satellite
            if (this.osmLayer) {
                this.map.removeLayer(this.osmLayer);
            }
            if (this.satelliteLayer) {
                this.map.addLayer(this.satelliteLayer);
            }
            this.isSatelliteMode = true;
        }
    }

    public getImageUrl(id: number): string {
        return `${environment.apiUrl}/api/chargingpoints/${id}/image`;
    }

    public closeMobilePopup(): void {
        this.showMobilePopup = false;
        this.mobilePopupChargePoint = null;
    }

    public onMobilePopupEdit(): void {
        if (this.mobilePopupChargePoint) {
            this.editChargePoint.emit(this.mobilePopupChargePoint);
            this.closeMobilePopup();
        }
    }

    public onMobilePopupDelete(): void {
        if (this.mobilePopupChargePoint) {
            this.deleteChargePoint.emit(this.mobilePopupChargePoint);
            this.closeMobilePopup();
        }
    }

    public onMobilePopupViewComments(): void {
        if (this.mobilePopupChargePoint) {
            this.viewComments.emit(this.mobilePopupChargePoint);
            this.closeMobilePopup();
        }
    }

    public onMobilePopupShare(): void {
        if (this.mobilePopupChargePoint) {
            this.shareService.shareChargingPoint(this.mobilePopupChargePoint);
        }
    }
}
