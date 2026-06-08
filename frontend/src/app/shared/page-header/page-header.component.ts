import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-page-header',
    standalone: true,
    imports: [MatIconModule, MatButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <header class="page-header">
            <div class="page-header__main">
                @if (showBack()) {
                    <button
                        type="button"
                        mat-icon-button
                        class="page-header__back"
                        (click)="onBack()"
                        aria-label="Tillbaka"
                    >
                        <mat-icon>arrow_back</mat-icon>
                    </button>
                }
                <h1 class="page-header__title">{{ title() }}</h1>
                <span class="page-header__badge">
                    <ng-content select="[pageHeaderBadge]" />
                </span>
            </div>
            <div class="page-header__actions">
                <ng-content select="[pageHeaderActions]" />
            </div>
        </header>
    `,
    styleUrl: './page-header.component.scss',
})
export class PageHeaderComponent {
    private readonly location = inject(Location);
    private readonly router = inject(Router);

    readonly title = input.required<string>();
    readonly showBack = input(true);
    /** Optional explicit route to navigate to on back. Falls back to Location.back(). */
    readonly backTo = input<string | null>(null);
    /** When true, the header only emits (back) and leaves navigation to the consumer. */
    readonly customBack = input(false);

    readonly back = output<void>();

    protected onBack(): void {
        this.back.emit();
        if (this.customBack()) {
            return;
        }
        const target = this.backTo();
        if (target) {
            this.router.navigateByUrl(target);
        } else {
            this.location.back();
        }
    }
}
