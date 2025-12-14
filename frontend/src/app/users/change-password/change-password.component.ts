import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { PasswordStrengthIndicatorComponent } from '../../dialogs/password-strength-indicator/password-strength-indicator.component';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-change-password',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule,
        PasswordStrengthIndicatorComponent,
    ],
    templateUrl: './change-password.component.html',
    styleUrl: './change-password.component.scss',
})
export class ChangePasswordComponent implements OnInit {
    private userService = inject(UserService);
    private authService = inject(AuthService);
    private snackBar = inject(MatSnackBar);
    private router = inject(Router);
    private dialogRef = inject(MatDialogRef<ChangePasswordComponent>);
    private fb = inject(FormBuilder);

    form: FormGroup;
    isChangingPassword = false;
    hidePassword = true;
    hideConfirmPassword = true;
    isNewPasswordValid = false;

    constructor() {
        this.form = this.fb.group({
            oldPassword: ['', [Validators.required]],
            newPassword: ['', [Validators.required]],
            confirmPassword: ['', [Validators.required]],
        });
    }

    ngOnInit() {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }
    }

    togglePasswordVisibility(): void {
        this.hidePassword = !this.hidePassword;
    }

    toggleConfirmPasswordVisibility(): void {
        this.hideConfirmPassword = !this.hideConfirmPassword;
    }

    getConfirmPasswordError(): string {
        const control = this.form.get('confirmPassword');
        if (control?.hasError('required'))
            return 'Bekräftelse av lösenord är obligatoriskt';
        if (this.form.get('newPassword')?.value !== control?.value) {
            return 'Lösenorden matchar inte';
        }
        return '';
    }

    async changePassword(): Promise<void> {
        if (
            this.form.invalid ||
            this.form.get('newPassword')?.value !==
                this.form.get('confirmPassword')?.value
        ) {
            this.snackBar.open('Vänligen fyll i alla fält korrekt', 'Stäng', {
                duration: 3000,
            });
            return;
        }

        this.isChangingPassword = true;

        try {
            await firstValueFrom(
                this.userService.changePassword({
                    oldPassword: this.form.get('oldPassword')?.value,
                    newPassword: this.form.get('newPassword')?.value,
                })
            );
            this.snackBar.open('Lösenord ändrat', 'Stäng', {
                duration: 3000,
            });
            // Close dialog and navigate home
            this.dialogRef.close();
            setTimeout(() => {
                this.router.navigate(['/']);
            }, 100);
        } catch (error: any) {
            console.error('Error changing password:', error);
            const errorMsg =
                error.error?.message ||
                error.error ||
                'Kunde inte ändra lösenord';
            this.snackBar.open(errorMsg, 'Stäng', { duration: 3000 });
        } finally {
            this.isChangingPassword = false;
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
