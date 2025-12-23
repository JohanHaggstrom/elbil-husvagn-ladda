import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';
import { ChargePointComment, CommentStats, CreateCommentRequest, VoteType } from '../../models/comment.model';
import { ChargingPoint, ChargingStationService } from '../../services/charging-station.service';
import { CommentService } from '../../services/comment.service';

@Component({
    selector: 'app-charge-point-details',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        FormsModule,
        MatTooltipModule
    ],
    templateUrl: './charge-point-details.component.html',
    styleUrl: './charge-point-details.component.scss',
})
export class ChargePointDetailsComponent implements OnInit {
    private commentService = inject(CommentService);
    private chargingStationService = inject(ChargingStationService);
    private snackBar = inject(MatSnackBar);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    protected authService = inject(AuthService);

    chargePoint: ChargingPoint | null = null;
    comments: ChargePointComment[] = [];
    newComment = '';
    selectedVote: VoteType | null = null;
    isLoading = false;
    isSaving = false;

    VoteType = VoteType;

    async ngOnInit(): Promise<void> {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) {
            await this.loadChargePoint(id);
            await this.loadComments(id);
        } else {
            this.router.navigate(['/']);
        }
    }

    get stats(): CommentStats {
        return {
            totalComments: this.comments.length,
            upVotes: this.comments.filter(c => c.vote === VoteType.UpVote).length,
            downVotes: this.comments.filter(c => c.vote === VoteType.DownVote).length
        };
    }

    private async loadChargePoint(id: number): Promise<void> {
        try {
            // Fetch all and find (temporary until getById exists)
            const stations = await firstValueFrom(this.chargingStationService.getChargingPoints());
            const point = stations.find((p: ChargingPoint) => p.id === id);
            if (point) {
                this.chargePoint = point;
            } else {
                this.snackBar.open('Laddstation hittades inte', 'Stäng', { duration: 3000 });
                this.router.navigate(['/']);
            }
        } catch (e) {
            console.error('Error loading station', e);
        }
    }

    private async loadComments(id: number): Promise<void> {
        this.isLoading = true;
        try {
            this.comments = await firstValueFrom(
                this.commentService.getComments(id)
            );
        } catch (error) {
            console.error('Error loading comments:', error);
            this.snackBar.open('Kunde inte ladda kommentarer', 'Stäng', { duration: 3000 });
        } finally {
            this.isLoading = false;
        }
    }

    async onSubmit(): Promise<void> {
        if (!this.chargePoint) return;

        if (this.selectedVote === null) {
            this.snackBar.open('Välj tumme upp eller ner', 'Stäng', { duration: 3000 });
            return;
        }

        this.isSaving = true;
        try {
            const request: CreateCommentRequest = {
                comment: this.newComment.trim() || '',
                vote: this.selectedVote
            };

            await firstValueFrom(
                this.commentService.createComment(this.chargePoint.id, request)
            );

            this.newComment = '';
            this.selectedVote = null;
            await this.loadComments(this.chargePoint.id);
            this.snackBar.open('Kommentar tillagd!', 'Stäng', { duration: 2000 });
        } catch (error) {
            console.error('Error creating comment:', error);
            this.snackBar.open('Kunde inte spara kommentar', 'Stäng', { duration: 3000 });
        } finally {
            this.isSaving = false;
        }
    }

    async deleteComment(comment: ChargePointComment): Promise<void> {
        if (!this.chargePoint) return;

        if (!confirm('Är du säker på att du vill ta bort denna kommentar?')) {
            return;
        }

        try {
            await firstValueFrom(
                this.commentService.deleteComment(this.chargePoint.id, comment.id)
            );
            await this.loadComments(this.chargePoint.id);
            this.snackBar.open('Kommentar borttagen', 'Stäng', { duration: 2000 });
        } catch (error) {
            console.error('Error deleting comment:', error);
            this.snackBar.open('Kunde inte ta bort kommentar', 'Stäng', { duration: 3000 });
        }
    }

    selectVote(vote: VoteType): void {
        this.selectedVote = vote;
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('sv-SE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    onBack(): void {
        this.router.navigate(['/']);
    }

    getImageUrl(): string {
        if (this.chargePoint?.id && this.chargePoint.hasImage) {
            return `${environment.apiUrl}/api/chargingpoints/${this.chargePoint.id}/image?t=${new Date().getTime()}`;
        }
        return '';
    }
}
