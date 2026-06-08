import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type VoteButtonVariant = 'up' | 'down';

@Component({
    selector: 'app-vote-button',
    standalone: true,
    imports: [MatButtonModule, MatIconModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <button
            mat-stroked-button
            type="button"
            class="vote-button"
            [class.vote-button--selected]="selected()"
            [class.vote-button--up]="variant() === 'up'"
            [class.vote-button--down]="variant() === 'down'"
        >
            <mat-icon>{{ iconName() }}</mat-icon>
            <ng-content />
        </button>
    `,
    styleUrl: './vote-button.component.scss',
})
export class VoteButtonComponent {
    readonly variant = input.required<VoteButtonVariant>();
    readonly selected = input(false);

    protected readonly iconName = computed(() =>
        this.variant() === 'up' ? 'thumb_up' : 'thumb_down'
    );
}
