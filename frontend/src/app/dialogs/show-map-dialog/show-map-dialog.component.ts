import { AfterViewInit, Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import type { LatLngExpression, Map } from 'leaflet';
declare var L: any;

export interface ShowMapDialogData {
  lat: number;
  lng: number;
  title: string;
}

@Component({
  selector: 'app-show-map-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './show-map-dialog.component.html',
  styleUrl: './show-map-dialog.component.scss'
})
export class ShowMapDialogComponent implements AfterViewInit {
  private map: Map | undefined;

  constructor(
    public dialogRef: MatDialogRef<ShowMapDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ShowMapDialogData
  ) { }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private initMap(): void {
    const center: LatLngExpression = [this.data.lat, this.data.lng];
    this.map = L.map('view-map').setView(center, 18);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

    // Custom icon
    const iconDefault = L.divIcon({
      className: 'custom-div-icon',
      html: `<span class="material-icons map-marker-icon blue">location_on</span>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });
    L.Marker.prototype.options.icon = iconDefault;

    L.marker(center).addTo(this.map)
      .bindPopup(this.data.title)
      .openPopup();

    // Fix map rendering issues in dialog
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }

  close(): void {
    this.dialogRef.close();
  }
}
