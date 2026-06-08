import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-empty-state',
    standalone: true,
    imports: [MatCardModule, MatIconModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <mat-card class="empty-state">
            <mat-card-content>
                <mat-icon class="empty-state__icon">{{ icon() }}</mat-icon>
                <h2 class="empty-state__title">{{ title() }}</h2>
                @if (message()) {
                    <p class="empty-state__message">{{ message() }}</p>
                }
                <div class="empty-state__actions">
                    <ng-content />
                </div>
            </mat-card-content>
        </mat-card>
    `,
    styleUrl: './empty-state.component.scss',
})
export class EmptyStateComponent {
    readonly icon = input('inbox');
    readonly title = input.required<string>();
    readonly message = input<string | null>(null);
}
