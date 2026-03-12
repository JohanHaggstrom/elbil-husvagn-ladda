import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { NobilDumpStation, NobilService, NobilStationMatch } from '../../services/nobil.service';

interface NobilImportState {
    countryCode: string;
    stations: NobilDumpStation[];
    filterName: string;
    filterCity: string;
    minCapacity: number;
    viewMode: 'import' | 'link';
    selectedStationUuid: number | null;
    originUrl: string;
}

@Component({
    selector: 'app-nobil-import',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatCardModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatButtonToggleModule,
        MatTooltipModule
    ],
    templateUrl: './nobil-import.component.html',
    styleUrls: ['./nobil-import.component.scss']
})
export class NobilImportComponent implements OnInit {
    countryCode: string = 'SWE';
    stations: NobilDumpStation[] = [];
    filterName: string = '';
    filterCity: string = '';
    minCapacity: number = 0;
    filteredStations: NobilDumpStation[] = [];
    matches: NobilStationMatch[] = [];
    viewMode: 'import' | 'link' = 'import';
    isLoading: boolean = false;
    selectedStation: NobilDumpStation | null = null;
    map: L.Map | undefined;
    marker: L.Marker | undefined;
    icon: L.Icon;
    private streetLayer: L.TileLayer | undefined;
    private satelliteLayer: L.TileLayer | undefined;
    isSatelliteMode: boolean = false;
    private readonly storageKey = 'nobilImportState';
    private originUrl: string = '/';

    constructor(
        private nobilService: NobilService,
        private snackBar: MatSnackBar,
        private location: Location,
        private router: Router
    ) {
        this.icon = L.icon({
            iconUrl: 'assets/marker-icon.png',
            shadowUrl: 'assets/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
    }

    ngOnInit() {
        this.initMapIfNeeded();
        this.restoreStateIfNeeded();
    }

    onBack(): void {
        this.router.navigateByUrl(this.originUrl);
    }

    initMapIfNeeded() {
        if (this.map) return;
        setTimeout(() => this.initMap(), 0);
    }

    initMap() {
        this.streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        });

        this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        });

        this.map = L.map('nobil-map', {
            center: [59.3293, 18.0686],
            zoom: 5,
            layers: this.streetLayer ? [this.streetLayer] : []
        });

        if (this.selectedStation) {
            this.selectStation(this.selectedStation);
        }
    }

    toggleSatelliteMode() {
        if (!this.map) return;

        if (this.isSatelliteMode) {
            if (this.satelliteLayer) {
                this.map.removeLayer(this.satelliteLayer);
            }
            if (this.streetLayer) {
                this.map.addLayer(this.streetLayer);
            }
            this.isSatelliteMode = false;
        } else {
            if (this.streetLayer) {
                this.map.removeLayer(this.streetLayer);
            }
            if (this.satelliteLayer) {
                this.map.addLayer(this.satelliteLayer);
            }
            this.isSatelliteMode = true;
        }
    }

    private saveState(selectedStationOverride?: NobilDumpStation | null) {
        const state: NobilImportState = {
            countryCode: this.countryCode,
            stations: this.stations,
            filterName: this.filterName,
            filterCity: this.filterCity,
            minCapacity: this.minCapacity,
            viewMode: this.viewMode,
            selectedStationUuid: (selectedStationOverride ?? this.selectedStation)?.uuid ?? null,
            originUrl: this.originUrl
        };
        sessionStorage.setItem(this.storageKey, JSON.stringify(state));
    }

    private restoreStateIfNeeded() {
        const navState = window.history.state as any;
        const originFromNav = navState && typeof navState.nobilOrigin === 'string' ? navState.nobilOrigin : null;

        if (!navState || navState.restoreNobilState !== true) {
            if (originFromNav) {
                this.originUrl = originFromNav;
            }
            sessionStorage.removeItem(this.storageKey);
            return;
        }

        const stored = sessionStorage.getItem(this.storageKey);
        if (!stored) {
            if (originFromNav) {
                this.originUrl = originFromNav;
            }
            return;
        }

        try {
            const parsed: NobilImportState = JSON.parse(stored);
            this.countryCode = parsed.countryCode;
            this.stations = parsed.stations;
            this.filterName = parsed.filterName;
            this.filterCity = parsed.filterCity;
            this.minCapacity = parsed.minCapacity;
            this.viewMode = parsed.viewMode;
            this.originUrl = parsed.originUrl || originFromNav || this.originUrl;

            this.filterStations();

            if (parsed.selectedStationUuid != null) {
                const found = this.stations.find(s => s.uuid === parsed.selectedStationUuid) || null;
                if (found) {
                    this.selectedStation = found;
                    if (this.map) {
                        this.selectStation(found);
                    }
                }
            }
        } catch {
            sessionStorage.removeItem(this.storageKey);
        }
    }

    search() {
        this.viewMode = 'import';
        this.initMapIfNeeded();
        this.isLoading = true;
        this.stations = [];
        this.selectedStation = null;
        if (this.marker) {
            this.map?.removeLayer(this.marker);
        }

        this.nobilService.searchStations(this.countryCode).subscribe({
            next: (data) => {
                this.stations = data;
                this.filterName = '';
                this.filterCity = '';
                this.minCapacity = 0;
                this.filterStations();
                this.isLoading = false;
                if (data.length === 0) {
                    this.snackBar.open('No new stations found', 'Close', { duration: 3000 });
                }
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
                this.snackBar.open('Error fetching stations', 'Close', { duration: 3000 });
            }
        });
    }

    filterStations() {
        this.filteredStations = this.stations.filter(station => {
            const name = station.name ? station.name.toLowerCase() : '';
            const city = station.city ? station.city.toLowerCase() : '';
            const filterN = this.filterName ? this.filterName.toLowerCase() : '';
            const filterC = this.filterCity ? this.filterCity.toLowerCase() : '';

            const matchName = !filterN || name.includes(filterN);
            const matchCity = !filterC || city.includes(filterC);

            const stationCap = Number(station.capacity) || 0;
            const filterCap = Number(this.minCapacity) || 0;
            const matchCapacity = stationCap >= filterCap;

            return matchName && matchCity && matchCapacity;
        });
    }

    selectStation(station: NobilDumpStation) {
        this.selectedStation = station;

        // Parse geolocation "(lat,long)"
        let lat = 0;
        let lng = 0;

        if (station.geolocation) {
            try {
                const parts = station.geolocation.replace(/[()]/g, '').split(',');
                if (parts.length === 2) {
                    lat = parseFloat(parts[0]);
                    lng = parseFloat(parts[1]);
                }
            } catch (e) {
                console.error('Error parsing geolocation', e);
            }
        }

        if (this.map) {
            this.map.setView([lat, lng], 15);
            if (this.marker) {
                this.map.removeLayer(this.marker);
            }
            this.marker = L.marker([lat, lng], { icon: this.icon }).addTo(this.map);
            this.marker.bindPopup(`<b>${station.name}</b><br>${station.street} ${station.house_number}`).openPopup();
        }
    }

    reviewAndAddStation(station: NobilDumpStation) {
        this.saveState(station);
        this.router.navigate(['/charge-points/new'], {
            state: {
                nobilStation: station,
                returnTo: '/admin/import/nobil'
            }
        });
    }

    ignoreStation(station: NobilDumpStation) {
        this.isLoading = true;
        this.nobilService.ignoreStation(station.uuid.toString()).subscribe({
            next: () => {
                this.snackBar.open('Station ignored', 'Close', { duration: 3000 });
                this.stations = this.stations.filter(s => s.uuid !== station.uuid);
                this.filterStations();
                this.selectedStation = null;
                if (this.marker) this.map?.removeLayer(this.marker);
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.snackBar.open('Error ignoring station', 'Close', { duration: 3000 });
                this.isLoading = false;
            }
        });
    }

    loadMatches() {
        this.viewMode = 'link';
        this.isLoading = true;
        this.matches = [];
        this.nobilService.getMatches(this.countryCode).subscribe({
            next: (data) => {
                this.matches = data;
                this.isLoading = false;
                if (data.length === 0) {
                    this.snackBar.open('No matches found based on distance', 'Close', { duration: 3000 });
                }
            },
            error: (err) => {
                console.error(err);
                this.isLoading = false;
                this.snackBar.open('Error fetching matches', 'Close', { duration: 3000 });
            }
        });
    }

    linkStation(match: NobilStationMatch) {
        this.isLoading = true;
        this.nobilService.linkStation(match.localStation.id, match.nobilStation.uuid.toString()).subscribe({
            next: () => {
                this.snackBar.open('Station linked successfully', 'Close', { duration: 3000 });
                this.matches = this.matches.filter(m => m.localStation.id !== match.localStation.id);
                this.isLoading = false;
            },
            error: (err) => {
                console.error(err);
                this.snackBar.open('Error linking station', 'Close', { duration: 3000 });
                this.isLoading = false;
            }
        });
    }
}
