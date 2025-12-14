import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class ThemeService {
    private document = inject(DOCUMENT);
    private darkModeSignal = signal<boolean>(this.loadThemeFromStorage());

    darkMode$ = this.darkModeSignal.asReadonly();

    constructor() {
        // Apply theme changes to document
        effect(() => {
            const isDark = this.darkModeSignal();
            const htmlElement = this.document.documentElement;

            if (isDark) {
                htmlElement.classList.add('dark-mode');
                htmlElement.classList.remove('light-mode');
            } else {
                htmlElement.classList.add('light-mode');
                htmlElement.classList.remove('dark-mode');
            }

            // Save to localStorage
            localStorage.setItem('theme-preference', isDark ? 'dark' : 'light');
        });
    }

    private loadThemeFromStorage(): boolean {
        const saved = localStorage.getItem('theme-preference');
        if (saved) {
            return saved === 'dark';
        }

        // Check system preference
        if (
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches
        ) {
            return true;
        }

        return false;
    }

    toggleDarkMode(): void {
        this.darkModeSignal.update((current) => !current);
    }

    setDarkMode(isDark: boolean): void {
        this.darkModeSignal.set(isDark);
    }

    isDarkMode(): boolean {
        return this.darkModeSignal();
    }
}
