import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ChargingStationService, SystemVersion } from '../services/charging-station.service';
import { FRONTEND_VERSION } from '../version';
import { PageLayoutComponent } from '../shared/page-layout/page-layout.component';
import { PageHeaderComponent } from '../shared/page-header/page-header.component';

@Component({
    selector: 'app-support',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        PageLayoutComponent,
        PageHeaderComponent
    ],
    templateUrl: './support.component.html',
    styleUrl: './support.component.scss'
})
export class SupportComponent implements OnInit {
    private router = inject(Router);
    private chargingStationService = inject(ChargingStationService);

    frontendVersion = FRONTEND_VERSION;
    backendVersionInfo: SystemVersion | null = null;

    ngOnInit(): void {
        this.chargingStationService.getSystemVersion().subscribe({
            next: (version) => {
                this.backendVersionInfo = version;
            },
            error: (err) => {
                console.error('Error fetching system version:', err);
            }
        });
    }

    goBack(): void {
        this.router.navigate(['/']);
    }
}
