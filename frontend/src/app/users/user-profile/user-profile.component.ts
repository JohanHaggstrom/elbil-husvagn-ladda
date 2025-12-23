import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-user-profile',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule,
    ],
    templateUrl: './user-profile.component.html',
    styleUrl: './user-profile.component.scss',
})
export class UserProfileComponent implements OnInit {
    private userService = inject(UserService);
    private authService = inject(AuthService);
    private snackBar = inject(MatSnackBar);
    private router = inject(Router);

    // Profile info
    username: string = '';
    email: string = '';
    role: string = '';
    isLoadingProfile = true;
    profileError: string | null = null;

    // Edit profile form
    editEmail: string = '';
    editUsername: string = '';
    isEditingProfile = false;
    isUpdatingProfile = false;

    ngOnInit() {
        this.loadUserProfile();
    }

    async loadUserProfile(): Promise<void> {
        this.isLoadingProfile = true;
        this.profileError = null;

        try {
            const response: any = await firstValueFrom(
                this.userService.getUserByUsername('')
            );

            this.username = response.username;
            this.email = response.email;
            this.role = response.role;
            this.editEmail = response.email;
            this.editUsername = response.username;
            this.isLoadingProfile = false;
        } catch (error: any) {
            console.error('Error loading profile:', error);
            this.profileError =
                error.error?.message ||
                error.message ||
                'Kunde inte ladda profil';
            this.isLoadingProfile = false;
        }
    }

    toggleEditProfile(): void {
        this.isEditingProfile = !this.isEditingProfile;

        if (!this.isEditingProfile) {
            this.editEmail = this.email;
            this.editUsername = this.username;
        }
    }

    async saveProfile(): Promise<void> {
        if (!this.editEmail || !this.editUsername) {
            this.snackBar.open('Vänligen fyll i alla fält', 'Stäng', {
                duration: 3000,
            });
            return;
        }

        this.isUpdatingProfile = true;

        try {
            await firstValueFrom(
                this.userService.updateProfile(
                    this.editEmail,
                    this.editUsername
                )
            );

            this.username = this.editUsername;
            this.email = this.editEmail;
            this.isEditingProfile = false;
            this.snackBar.open('Profil uppdaterad', 'Stäng', {
                duration: 3000,
            });
        } catch (error: any) {
            console.error('Error updating profile:', error);
            const errorMsg =
                error.error?.message ||
                error.message ||
                'Kunde inte uppdatera profil';
            this.snackBar.open(errorMsg, 'Stäng', { duration: 3000 });
        } finally {
            this.isUpdatingProfile = false;
        }
    }

    onCancel(): void {
        this.router.navigate(['/']);
    }

    getRoleBadgeClass(): string {
        switch (this.role) {
            case 'SuperAdmin':
                return 'role-badge superadmin';
            case 'Admin':
                return 'role-badge admin';
            default:
                return 'role-badge user';
        }
    }
}
