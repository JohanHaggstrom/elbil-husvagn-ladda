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
    // Kartan initieras lazy vid första sökning
  }

  onBack(): void {
    this.location.back();
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
    this.router.navigate(['/charge-points/new'], { state: { nobilStation: station } });
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
