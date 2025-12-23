import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { IdentifiedCaravanChargePoint } from '../app.model';
import { AuthService } from '../auth/auth.service';
import { MapComponent } from '../map/map.component';
import { BackupService } from '../services/backup.service';
import { ChargingStationService } from '../services/charging-station.service';
import { ConnectionService } from '../services/connection.service';
import { ErrorService } from '../services/error.service';
import { FeedbackService } from '../services/feedback.service';
import { ThemeService } from '../services/theme.service';

@Component({
    selector: 'app-home',
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatMenuModule,
        MatDividerModule,
        MapComponent,
        MatButtonToggleModule,
        MatInputModule,
        MatFormFieldModule,
        FormsModule,
    ],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
    protected title = 'Elbil. Husvagn. Ladda.';
    protected viewMode: 'map' | 'list' = 'map';
    protected searchText = '';
    protected identifiedChargePoints: IdentifiedCaravanChargePoint[] = [];
    protected isLoading = false;
    protected isOnline = true;

    protected get filteredChargePoints(): IdentifiedCaravanChargePoint[] {
        if (!this.searchText) {
            return this.identifiedChargePoints;
        }
        const lowerSearch = this.searchText.toLowerCase();
        return this.identifiedChargePoints.filter(
            (point) =>
                point.title.toLowerCase().includes(lowerSearch) ||
                point.city.toLowerCase().includes(lowerSearch) ||
                (point.address1 &&
                    point.address1.toLowerCase().includes(lowerSearch))
        );
    }

    protected authService = inject(AuthService);
    protected themeService = inject(ThemeService);
    private router = inject(Router);
    private chargingStationService = inject(ChargingStationService);
    private connectionService = inject(ConnectionService);
    private errorService = inject(ErrorService);
    private feedbackService = inject(FeedbackService);
    private backupService = inject(BackupService);
    private snackBar = inject(MatSnackBar);

    protected unhandledFeedbackCount = 0;

    navigateToLogin(): void {
        this.router.navigate(['/login']);
    }

    navigateToFeedback(): void {
        this.router.navigate(['/feedback']);
    }

    navigateToSupport(): void {
        this.router.navigate(['/support']);
    }

    navigateToAdminFeedback(): void {
        this.router.navigate(['/admin/feedback']);
    }

    navigateToAdminSuggestions(): void {
        this.router.navigate(['/admin/suggestions']);
    }

    navigateToProfile(): void {
        this.router.navigate(['/user/profile']);
    }

    navigateToChangePassword(): void {
        this.router.navigate(['/user/change-password']);
    }

    navigateToUserList(): void {
        this.router.navigate(['/admin/users']);
    }

    async exportChargingPoints(): Promise<void> {
        try {
            const blob = await firstValueFrom(
                this.backupService.exportChargingPoints()
            );
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup-${new Date()
                .toISOString()
                .slice(0, 10)}.json`;
            link.click();
            window.URL.revokeObjectURL(url);
            this.snackBar.open(
                'Backup exporterad! (Laddstationer, kommentarer & användare)',
                'Stäng',
                {
                    duration: 5000,
                }
            );
        } catch (error) {
            this.errorService.handleError('Kunde inte exportera backup');
        }
    }

    logout(): void {
        this.authService.logout();
    }

    ngOnInit(): void {
        this.loadChargingPoints();

        if (this.authService.isAuthenticated()) {
            this.loadUnhandledFeedbackCount();
            this.loadUnhandledSuggestionsCount();
        }

        this.connectionService.online$.subscribe((isOnline) => {
            this.isOnline = isOnline;
            if (isOnline && this.identifiedChargePoints.length === 0) {
                this.loadChargingPoints();
            }
        });
    }

    navigateToEdit(point: IdentifiedCaravanChargePoint): void {
        this.router.navigate(['/charge-points', point.id, 'edit']);
    }

    navigateToCreate(): void {
        if (this.authService.isAdmin()) {
            this.router.navigate(['/charge-points', 'new']);
        } else {
            this.router.navigate(['/charge-points', 'suggest']);
        }
    }

    async deleteChargePoint(
        point: IdentifiedCaravanChargePoint
    ): Promise<void> {
        if (confirm(`Är du säker på att du vill ta bort "${point.title}"?`)) {
            try {
                await firstValueFrom(
                    this.chargingStationService.deleteChargingPoint(point.id)
                );
                await this.loadChargingPoints();
            } catch (err) {
                console.error('Error deleting charging point:', err);
                alert('Kunde inte ta bort laddstationen.');
            }
        }
    }

    navigateToDetails(point: IdentifiedCaravanChargePoint): void {
        this.router.navigate(['/charge-points', point.id]);
    }

    private async loadChargingPoints(): Promise<void> {
        if (!this.connectionService.isOnline()) {
            this.errorService.handleError(
                new Error('Ingen internetanslutning'),
                'Kan inte ladda laddstationer'
            );
            return;
        }

        this.isLoading = true;
        try {
            const points = await firstValueFrom(
                this.chargingStationService.getChargingPoints()
            );
            this.identifiedChargePoints = points.map((point) => ({
                id: point.id,
                title: point.title,
                address1: point.address1,
                address2: point.address2 || '',
                postalCode: point.postalCode,
                city: point.city,
                country: point.country,
                comments: point.comments || '',
                mapCoordinates: point.mapCoordinates,
                numberOfChargePoints: point.numberOfChargePoints,
                capacity: point.capacity,
                hasImage: point.hasImage,
            }));
        } catch (error) {
            this.errorService.handleError(
                error,
                'Kunde inte ladda laddstationer'
            );
            // Keep any existing data if reload fails
        } finally {
            this.isLoading = false;
        }
    }

    private loadUnhandledFeedbackCount(): void {
        this.feedbackService.getUnhandledCount().subscribe({
            next: (count) => {
                this.unhandledFeedbackCount = count;
            },
            error: (error) => {
                console.error('Error loading unhandled feedback count:', error);
                // Silently fail - not critical
            },
        });
    }

    protected unhandledSuggestionsCount = 0;

    private loadUnhandledSuggestionsCount(): void {
        this.chargingStationService.getSuggestedCount().subscribe({
            next: (count) => {
                this.unhandledSuggestionsCount = count;
            },
            error: (error) => {
                console.error(
                    'Error loading unhandled suggestions count:',
                    error
                );
            },
        });
    }

    protected getImageUrl(id: number): string {
        return `${environment.apiUrl}/api/chargingpoints/${id}/image`;
    }
}
