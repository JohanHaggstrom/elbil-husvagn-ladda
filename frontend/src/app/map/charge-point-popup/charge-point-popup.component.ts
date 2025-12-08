import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../environments/environment';
import { IdentifiedCaravanChargePoint } from '../../app.model';

@Component({
    selector: 'app-charge-point-popup',
    imports: [CommonModule, MatIconModule],
    templateUrl: './charge-point-popup.component.html',
    styleUrl: './charge-point-popup.component.scss'
})
export class ChargePointPopupComponent {
    @Input() chargePoint!: IdentifiedCaravanChargePoint;
    @Input() isAuthenticated: boolean = false;
    @Output() edit = new EventEmitter<void>();
    @Output() delete = new EventEmitter<void>();
    @Output() viewComments = new EventEmitter<void>();

    get capacityColor(): string {
        if (this.chargePoint.capacity > 50) return '#10b981';
        if (this.chargePoint.capacity >= 22) return '#f59e0b';
        return '#ef4444';
    }

    get googleMapsUrl(): string {
        return `https://www.google.com/maps/place/${this.chargePoint.mapCoordinates}`;
    }

    onEdit(): void {
        this.edit.emit();
    }

    onDelete(): void {
        this.delete.emit();
    }

    onViewComments(): void {
        this.viewComments.emit();
    }

    getImageUrl(): string {
        return `${environment.apiUrl}/api/chargingpoints/${this.chargePoint.id}/image`;
    }
}
