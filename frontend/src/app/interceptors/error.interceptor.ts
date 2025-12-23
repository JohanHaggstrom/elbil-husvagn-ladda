import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, retry, timer } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ErrorService } from '../services/error.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const errorService = inject(ErrorService);

    return next(req).pipe(
        // Retry failed requests (except for POST/PUT/DELETE to avoid duplicates)
        retry({
            count: req.method === 'GET' ? 2 : 0,
            delay: (error, retryCount) => {
                // Only retry on network errors or 5xx server errors
                if (error instanceof HttpErrorResponse) {
                    if (error.status === 0 || error.status >= 500) {
                        // Exponential backoff: 1s, 2s, 4s...
                        return timer(Math.pow(2, retryCount) * 1000);
                    }
                }
                throw error;
            }
        }),
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                // 401 Unauthorized - Token expired or invalid
                const authService = inject(AuthService); // Inject here to avoid circular dependency issues in construction
                authService.logout();
            } else {
                errorService.handleError(error);
            }
            throw error;
        })
    );
};
