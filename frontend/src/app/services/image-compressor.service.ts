import { Injectable } from '@angular/core';
import { ImageConstants } from '../models/image-settings.model';

@Injectable({
    providedIn: 'root'
})
export class ImageCompressorService {

    constructor() { }

    /**
     * Compresses and resizes an image file.
     * @param file The file to compress.
     * @param maxWidth Maximum width of the output image.
     * @param maxHeight Maximum height of the output image.
     * @param quality Quality of the output image (0 to 1).
     * @returns A Promise resolving to the compressed File.
     */
    compressImage(file: File, maxWidth: number = ImageConstants.MAX_WIDTH, maxHeight: number = ImageConstants.MAX_HEIGHT, quality: number = ImageConstants.COMPRESSION_QUALITY): Promise<File> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event: any) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const elem = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions
                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    elem.width = width;
                    elem.height = height;
                    const ctx = elem.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Could not get canvas context'));
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);

                    // Determine output format (prefer original if supported, otherwise JPEG for compression)
                    let mimeType = file.type;
                    if (mimeType !== 'image/png' && mimeType !== 'image/webp') {
                        mimeType = 'image/jpeg';
                    }
                    // Force JPEG for better compression if it was PNG but we want to ignore transparency for photos?
                    // Usually for photos JPEG is best. Let's default to JPEG if user uploaded a huge PNG photo,
                    // unless transparency is needed. But for charge points, transparency is rarely needed.
                    // However, let's respect WebP if used.
                    // To be safe and simple: Convert everything to JPEG or WebP?
                    // The backend supports jpg, png, webp.
                    // Let's stick to using 'image/jpeg' for compression efficiency unless it's WebP.
                    if (mimeType === 'image/png') {
                        // PNG doesn't support quality parameter in toBlob, so if we want compression we might want JPEG.
                        // Let's convert PNG to JPEG for space saving as these are likely photos.
                        mimeType = 'image/jpeg';
                    }

                    ctx.canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Canvas toBlob failed'));
                            return;
                        }
                        const newFile = new File([blob], file.name, {
                            type: mimeType,
                            lastModified: Date.now(),
                        });
                        resolve(newFile);
                    }, mimeType, quality);
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    }
}
