import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    private themeService = inject(ThemeService);

    constructor() {
        // Initialize theme from localStorage/system preference
        this.themeService.isDarkMode();
    }
}
