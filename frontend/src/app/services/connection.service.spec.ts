import { TestBed } from '@angular/core/testing';
import { ConnectionService } from './connection.service';

describe('ConnectionService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({});
    });

    it('initialises from navigator.onLine', () => {
        vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
        const service = TestBed.inject(ConnectionService);
        expect(service.isOnline()).toBe(false);
    });

    it('updates state when the window emits online/offline events', () => {
        vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
        const service = TestBed.inject(ConnectionService);
        expect(service.isOnline()).toBe(true);

        window.dispatchEvent(new Event('offline'));
        expect(service.isOnline()).toBe(false);

        window.dispatchEvent(new Event('online'));
        expect(service.isOnline()).toBe(true);
    });

    it('online$ emits the current value to new subscribers', () => {
        vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
        const service = TestBed.inject(ConnectionService);

        const seen: boolean[] = [];
        service.online$.subscribe(v => seen.push(v));

        window.dispatchEvent(new Event('offline'));

        expect(seen).toEqual([true, false]);
    });
});
