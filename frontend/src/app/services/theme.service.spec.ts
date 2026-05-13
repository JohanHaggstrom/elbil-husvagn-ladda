import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove('dark-mode', 'light-mode');
        TestBed.configureTestingModule({});
    });

    it('should be created', () => {
        const service = TestBed.inject(ThemeService);
        expect(service).toBeTruthy();
    });

    it('defaults to light mode when no preference is stored', () => {
        const service = TestBed.inject(ThemeService);
        expect(service.isDarkMode()).toBe(false);
    });

    it('reads the stored preference from localStorage', () => {
        localStorage.setItem('theme-preference', 'dark');
        const service = TestBed.inject(ThemeService);
        expect(service.isDarkMode()).toBe(true);
    });

    it('toggleDarkMode flips the current value', () => {
        const service = TestBed.inject(ThemeService);
        const initial = service.isDarkMode();
        service.toggleDarkMode();
        expect(service.isDarkMode()).toBe(!initial);
    });
});
