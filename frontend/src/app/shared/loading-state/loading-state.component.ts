import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
    selector: 'app-loading-state',
    standalone: true,
    imports: [MatProgressSpinnerModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="loading-state">
            <mat-spinner [diameter]="diameter()"></mat-spinner>
            @if (message()) {
                <p class="loading-state__message">{{ message() }}</p>
            }
        </div>
    `,
    styleUrl: './loading-state.component.scss',
})
export class LoadingStateComponent {
    readonly message = input<string | null>(null);
    readonly diameter = input(50);
}
