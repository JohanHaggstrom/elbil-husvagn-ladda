import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../../services/user.service';
import { PasswordStrengthIndicatorComponent } from '../password-strength-indicator/password-strength-indicator.component';

@Component({
    selector: 'app-add-user-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatIconModule,
        MatProgressSpinnerModule,
        PasswordStrengthIndicatorComponent,
    ],
    templateUrl: './add-user-dialog.component.html',
    styleUrl: './add-user-dialog.component.scss',
})
export class AddUserDialogComponent {
    private userService = inject(UserService);
    private snackBar = inject(MatSnackBar);
    private dialogRef = inject(MatDialogRef<AddUserDialogComponent>);
    private fb = inject(FormBuilder);

    form: FormGroup;
    isSubmitting = false;
    hidePassword = true;
    hideConfirmPassword = true;
    isPasswordValid = false;

    roles = ['User', 'Admin', 'SuperAdmin'];

    constructor() {
        this.form = this.fb.group({
            username: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required]],
            confirmPassword: ['', [Validators.required]],
            role: ['Admin', Validators.required],
        });
    }

    get usernameError(): string {
        const control = this.form.get('username');
        if (control?.hasError('required'))
            return 'Användarnamn är obligatoriskt';
        if (control?.hasError('minlength')) return 'Minst 3 tecken';
        return '';
    }

    get emailError(): string {
        const control = this.form.get('email');
        if (control?.hasError('required')) return 'Email är obligatoriskt';
        if (control?.hasError('email')) return 'Ogiltig email-adress';
        return '';
    }

    get passwordError(): string {
        const control = this.form.get('password');
        if (control?.hasError('required')) return 'Lösenord är obligatoriskt';
        return '';
    }

    get confirmPasswordError(): string {
        const control = this.form.get('confirmPassword');
        if (control?.hasError('required'))
            return 'Bekräftelse av lösenord är obligatoriskt';
        if (this.form.get('password')?.value !== control?.value) {
            return 'Lösenorden matchar inte';
        }
        return '';
    }

    togglePasswordVisibility(): void {
        this.hidePassword = !this.hidePassword;
    }

    toggleConfirmPasswordVisibility(): void {
        this.hideConfirmPassword = !this.hideConfirmPassword;
    }

    async onSubmit(): Promise<void> {
        if (
            this.form.invalid ||
            !this.isPasswordValid ||
            this.form.get('password')?.value !==
                this.form.get('confirmPassword')?.value
        ) {
            this.snackBar.open('Vänligen fyll i alla fält korrekt', 'Stäng', {
                duration: 3000,
            });
            return;
        }

        this.isSubmitting = true;

        const { confirmPassword, ...userData } = this.form.value;

        try {
            const user = await firstValueFrom(
                this.userService.createUser(userData)
            );
            this.snackBar.open('Användare skapad framgångsrikt', 'Stäng', {
                duration: 3000,
            });
            this.dialogRef.close(user);
        } catch (error: any) {
            const errorMsg =
                error.error?.message ||
                error.message ||
                'Kunde inte skapa användare';
            this.snackBar.open(errorMsg, 'Stäng', { duration: 3000 });
            this.isSubmitting = false;
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
