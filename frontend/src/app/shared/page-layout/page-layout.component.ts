import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type PageLayoutVariant = 'form' | 'list' | 'wide';

@Component({
    selector: 'app-page-layout',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="page">
            <ng-content select="app-page-header" />
            <div class="page__content" [style.--content-max-width]="contentMaxWidth()">
                <ng-content />
            </div>
        </div>
    `,
    styleUrl: './page-layout.component.scss',
})
export class PageLayoutComponent {
    readonly variant = input<PageLayoutVariant>('form');

    protected readonly contentMaxWidth = computed(() => {
        switch (this.variant()) {
            case 'list':
                return 'var(--page-max-width-list)';
            case 'wide':
                return 'var(--page-max-width-wide)';
            default:
                return 'var(--page-max-width-form)';
        }
    });
}
