import { Injectable } from '@angular/core';

export interface ShareData {
    title: string;
    text: string;
    url: string;
}

@Injectable({
    providedIn: 'root'
})
export class ShareService {
    canShare(): boolean {
        return !!navigator.share;
    }

    async share(data: ShareData): Promise<boolean> {
        if (!this.canShare()) {
            console.warn('Web Share API not supported on this browser.');
            return false;
        }

        try {
            await navigator.share(data);
            return true;
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Error sharing:', error);
            }
            return false;
        }
    }

    async shareChargingPoint(point: { title: string, city: string, mapCoordinates: string, address1: string }): Promise<void> {
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${point.mapCoordinates}`;
        const shareData: ShareData = {
            title: point.title,
            text: `${point.title}\n${point.address1}, ${point.city}`,
            url: googleMapsUrl
        };

        await this.share(shareData);
    }
}
