import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { ShowMapDialogComponent } from '../dialogs/show-map-dialog/show-map-dialog.component';
import { ChargingPoint, ChargingStationService } from '../services/charging-station.service';

@Component({
    selector: 'app-admin-suggestions',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatTooltipModule
    ],
    templateUrl: './admin-suggestions.component.html',
    styleUrl: './admin-suggestions.component.scss'
})
export class AdminSuggestionsComponent implements OnInit {
    private chargingStationService = inject(ChargingStationService);
    private snackBar = inject(MatSnackBar);
    private router = inject(Router);
    private dialog = inject(MatDialog);
    authService = inject(AuthService);

    suggestions: ChargingPoint[] = [];
    isLoading = false;

    ngOnInit(): void {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }
        this.loadSuggestions();
    }

    loadSuggestions(): void {
        this.isLoading = true;
        this.chargingStationService.getSuggestedChargingPoints().subscribe({
            next: (data) => {
                this.suggestions = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading suggestions:', err);
                this.snackBar.open('Kunde inte ladda förslag', 'Stäng', { duration: 3000 });
                this.isLoading = false;
            }
        });
    }

    approveSuggestion(suggestion: ChargingPoint): void {
        if (!confirm(`Vill du godkänna "${suggestion.title}"?`)) {
            return;
        }

        this.chargingStationService.approveSuggestedChargingPoint(suggestion.id).subscribe({
            next: () => {
                this.suggestions = this.suggestions.filter(s => s.id !== suggestion.id);
                this.snackBar.open('Förslag godkänt och tillagt!', 'Stäng', { duration: 3000 });
            },
            error: (err) => {
                console.error('Error approving suggestion:', err);
                this.snackBar.open('Kunde inte godkänna förslag', 'Stäng', { duration: 3000 });
            }
        });
    }

    deleteSuggestion(suggestion: ChargingPoint): void {
        if (!confirm(`Vill du NEKA/TA BORT förslaget "${suggestion.title}"?`)) {
            return;
        }

        this.chargingStationService.deleteSuggestedChargingPoint(suggestion.id).subscribe({
            next: () => {
                this.suggestions = this.suggestions.filter(s => s.id !== suggestion.id);
                this.snackBar.open('Förslag borttaget!', 'Stäng', { duration: 3000 });
            },
            error: (err) => {
                console.error('Error deleting suggestion:', err);
                this.snackBar.open('Kunde inte ta bort förslag', 'Stäng', { duration: 3000 });
            }
        });
    }

    getSuggestionImageUrl(id: number): string {
        return `${environment.apiUrl}/api/suggestedchargingpoints/${id}/image`;
    }

    viewOnMap(suggestion: ChargingPoint): void {
        const coords = this.parseCoordinates(suggestion.mapCoordinates);
        if (coords) {
            this.dialog.open(ShowMapDialogComponent, {
                data: {
                    lat: coords[0],
                    lng: coords[1],
                    title: suggestion.title
                },
                width: '95vw',
                maxWidth: '95vw',
                maxHeight: '95vh',
                panelClass: 'full-screen-map-dialog'
            });
        } else {
            this.snackBar.open('Ogiltiga koordinater', 'Stäng', { duration: 3000 });
        }
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

    goBack(): void {
        this.router.navigate(['/']);
    }
}
