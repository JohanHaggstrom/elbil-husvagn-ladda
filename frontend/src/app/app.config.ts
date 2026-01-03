import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RECAPTCHA_SETTINGS, RecaptchaSettings } from 'ng-recaptcha-2';
import { routes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideAnimationsAsync(),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        {
            provide: RECAPTCHA_SETTINGS,
            useValue: {
                siteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
            } as RecaptchaSettings,
        },
    ],
};
