import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { IdentifiedCaravanChargePoint } from '../app.model';
import { AuthService } from '../auth/auth.service';
import { ChargePointCommentsDialogComponent } from '../dialogs/charge-point-comments-dialog/charge-point-comments-dialog.component';
import { EditChargingPointDialogComponent } from '../dialogs/edit-charging-point-dialog/edit-charging-point-dialog.component';
import { MapComponent } from '../map/map.component';
import { ChargingStationService } from '../services/charging-station.service';
import { ConnectionService } from '../services/connection.service';
import { ErrorService } from '../services/error.service';
import { FeedbackService } from '../services/feedback.service';
import { ChangePasswordComponent } from '../users/change-password/change-password.component';
import { UserProfileComponent } from '../users/user-profile/user-profile.component';

@Component({
    selector: 'app-home',
    imports: [
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
    private router = inject(Router);
    private chargingStationService = inject(ChargingStationService);
    private dialog = inject(MatDialog);
    private connectionService = inject(ConnectionService);
    private errorService = inject(ErrorService);
    private feedbackService = inject(FeedbackService);

    protected unhandledFeedbackCount = 0;

    navigateToLogin(): void {
        this.router.navigate(['/login']);
    }

    navigateToFeedback(): void {
        this.router.navigate(['/feedback']);
    }

    navigateToAdminFeedback(): void {
        this.router.navigate(['/admin/feedback']);
    }

    navigateToAdminSuggestions(): void {
        this.router.navigate(['/admin/suggestions']);
    }

    navigateToProfile(): void {
        this.dialog.open(UserProfileComponent);
    }

    navigateToChangePassword(): void {
        this.dialog.open(ChangePasswordComponent);
    }

    navigateToUserList(): void {
        this.router.navigate(['/admin/users']);
    }

    logout(): void {
        this.authService.logout();
    }

    ngOnInit(): void {
        this.loadChargingPoints();

        // Load unhandled feedback and suggestions count if admin
        if (this.authService.isAuthenticated()) {
            this.loadUnhandledFeedbackCount();
            this.loadUnhandledSuggestionsCount();
        }

        // Monitor connection status
        this.connectionService.online$.subscribe((isOnline) => {
            this.isOnline = isOnline;
            if (isOnline && this.identifiedChargePoints.length === 0) {
                // Retry loading when connection is restored
                this.loadChargingPoints();
            }
        });
    }

    async openEditDialog(point: IdentifiedCaravanChargePoint): Promise<void> {
        const dialogRef = this.dialog.open(EditChargingPointDialogComponent, {
            data: point,
            width: '600px',
            maxWidth: '95vw',
        });

        const result = await firstValueFrom(dialogRef.afterClosed());
        if (result) {
            await this.loadChargingPoints();
        }
    }

    async openCreateDialog(): Promise<void> {
        const dialogRef = this.dialog.open(EditChargingPointDialogComponent, {
            data: null,
            width: '600px',
            maxWidth: '95vw',
        });

        const result = await firstValueFrom(dialogRef.afterClosed());
        if (result) {
            await this.loadChargingPoints();
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

    openCommentsDialog(point: IdentifiedCaravanChargePoint): void {
        this.dialog.open(ChargePointCommentsDialogComponent, {
            data: point,
            width: '700px',
            maxWidth: '95vw',
            maxHeight: '90vh',
        });
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
