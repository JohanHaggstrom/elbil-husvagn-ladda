import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
    AfterViewInit,
    ApplicationRef,
    Component,
    createComponent,
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
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { firstValueFrom } from 'rxjs';
import { IdentifiedCaravanChargePoint } from '../app.model';
import { AuthService } from '../auth/auth.service';
import { ChargePointPopupComponent } from './charge-point-popup/charge-point-popup.component';

@Component({
    selector: 'app-map',
    imports: [CommonModule, FormsModule, MatIconModule],
    templateUrl: './map.component.html',
    styleUrl: './map.component.scss',
})
export class MapComponent
    implements OnInit, AfterViewInit, OnChanges, OnDestroy
{
    @Input() chargePoints: IdentifiedCaravanChargePoint[] = [];
    @Output() chargePointSelected =
        new EventEmitter<IdentifiedCaravanChargePoint>();
    @Output() editChargePoint =
        new EventEmitter<IdentifiedCaravanChargePoint>();
    @Output() deleteChargePoint =
        new EventEmitter<IdentifiedCaravanChargePoint>();
    @Output() viewComments = new EventEmitter<IdentifiedCaravanChargePoint>();

    private map: L.Map | null = null;
    private markerClusterGroup: L.MarkerClusterGroup | null = null;
    private userLocationMarker: L.Marker | null = null;
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private appRef = inject(ApplicationRef);
    private injector = inject(EnvironmentInjector);

    public searchQuery: string = '';
    public searchResults: any[] = [];
    public isSearching: boolean = false;
    public isSatelliteMode: boolean = false;
    private osmLayer: L.TileLayer | null = null;
    private satelliteLayer: L.TileLayer | null = null;

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
        if (changes['chargePoints'] && !changes['chargePoints'].firstChange) {
            this.addMarkers();
        }
    }

    ngOnDestroy(): void {
        if (this.map) {
            this.map.remove();
        }
    }

    private initMap(): void {
        // Center map on Sweden (approximately)
        this.map = L.map('map', {
            center: [62.0, 15.0],
            zoom: 5,
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
        this.osmLayer.addTo(this.map);

        // Add satellite layer (USGS Satellite)
        this.satelliteLayer = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                maxZoom: 19,
                attribution: '&copy; Esri, DigitalGlobe, Earthstar Geographics',
            }
        );

        // Initialize marker cluster group
        this.markerClusterGroup = L.markerClusterGroup({
            chunkedLoading: true,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
        });
        this.map.addLayer(this.markerClusterGroup);
    }

    private addMarkers(): void {
        if (!this.map || !this.markerClusterGroup) return;

        // Clear existing markers
        this.markerClusterGroup.clearLayers();

        // Add marker for each charge point
        this.chargePoints.forEach((point) => {
            const coords = this.parseCoordinates(point.mapCoordinates);
            if (coords && this.markerClusterGroup) {
                const icon = this.getMarkerIcon(point.capacity);
                const marker = L.marker(coords, { icon }).bindPopup(
                    this.createPopupContent(point)
                );

                marker.on('click', () => {
                    this.chargePointSelected.emit(point);
                });

                this.markerClusterGroup.addLayer(marker);
            }
        });

        // Fit map to show all markers if there are any
        if (this.markerClusterGroup.getLayers().length > 0 && this.map) {
            const bounds = this.markerClusterGroup.getBounds();
            this.map.fitBounds(bounds.pad(0.1));
        }
    }

    private getMarkerIcon(capacity: number): L.DivIcon {
        let colorClass: string;

        // Color code based on capacity
        if (capacity > 50) {
            colorClass = 'green'; // High capacity
        } else if (capacity >= 22) {
            colorClass = 'yellow'; // Medium capacity
        } else {
            colorClass = 'red'; // Low capacity
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

    private createPopupContent(
        point: IdentifiedCaravanChargePoint
    ): HTMLElement {
        // Create the component dynamically
        const componentRef = createComponent(ChargePointPopupComponent, {
            environmentInjector: this.injector,
        });

        // Set the inputs
        componentRef.instance.chargePoint = point;
        componentRef.instance.isAuthenticated =
            this.authService.isAuthenticated();

        // Subscribe to outputs
        componentRef.instance.edit.subscribe(() => {
            this.editChargePoint.emit(point);
        });

        componentRef.instance.delete.subscribe(() => {
            this.deleteChargePoint.emit(point);
            this.map?.closePopup();
        });

        componentRef.instance.viewComments.subscribe(() => {
            this.viewComments.emit(point);
        });

        // Attach to the application
        this.appRef.attachView(componentRef.hostView);

        // Get the DOM element
        const domElem = (componentRef.hostView as any)
            .rootNodes[0] as HTMLElement;

        return domElem;
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
                    console.error('Error getting user location:', error);
                    alert(
                        'Kunde inte hämta din position. Kontrollera att du har gett tillåtelse för platsåtkomst.'
                    );
                }
            );
        } else {
            alert('Geolocation stöds inte av din webbläsare.');
        }
    }
    public async searchLocation(): Promise<void> {
        if (!this.searchQuery || this.searchQuery.length < 3) return;

        this.isSearching = true;
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
                alert('Inga platser hittades.');
            }
        } catch (err) {
            this.isSearching = false;
            console.error('Search error:', err);
            alert('Ett fel uppstod vid sökning.');
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
}
