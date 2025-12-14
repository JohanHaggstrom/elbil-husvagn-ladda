import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { AddUserDialogComponent } from '../../dialogs/add-user-dialog/add-user-dialog.component';
import { User, UserService } from '../../services/user.service';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    templateUrl: './user-list.component.html',
    styleUrl: './user-list.component.scss',
})
export class UserListComponent implements OnInit {
    private userService = inject(UserService);
    private authService = inject(AuthService);
    private snackBar = inject(MatSnackBar);
    private router = inject(Router);
    private dialog = inject(MatDialog);

    users: User[] = [];
    isLoading = true;
    loadError: string | null = null;

    displayedColumns: string[] = [
        'username',
        'email',
        'role',
        'createdAt',
        'actions',
    ];

    ngOnInit() {
        if (!this.authService.isSuperAdmin()) {
            this.router.navigate(['/']);
            return;
        }

        this.loadUsers();
    }

    async loadUsers(): Promise<void> {
        this.isLoading = true;
        this.loadError = null;

        try {
            this.users = await firstValueFrom(this.userService.getUsers());
            this.isLoading = false;
        } catch (error: any) {
            console.error('Error loading users:', error);
            this.loadError =
                error.error?.message ||
                error.message ||
                'Kunde inte ladda användare';
            this.snackBar.open(
                this.loadError || 'Kunde inte ladda användare',
                'Stäng',
                { duration: 5000 }
            );
            this.isLoading = false;
        }
    }

    async deleteUser(user: User): Promise<void> {
        if (user.role === 'SuperAdmin') {
            this.snackBar.open('SuperAdmin kan inte tas bort', 'Stäng', {
                duration: 3000,
            });
            return;
        }

        if (
            !confirm(`Är du säker på att du vill ta bort "${user.username}"?`)
        ) {
            return;
        }

        try {
            await firstValueFrom(this.userService.deleteUser(user.id));
            this.users = this.users.filter((u) => u.id !== user.id);
            this.snackBar.open('Användare borttagen', 'Stäng', {
                duration: 3000,
            });
        } catch (error: any) {
            console.error('Error deleting user:', error);
            const errorMsg =
                error.error?.message ||
                error.message ||
                'Kunde inte ta bort användare';
            this.snackBar.open(errorMsg, 'Stäng', { duration: 3000 });
        }
    }

    canDeleteUser(user: User): boolean {
        return user.role !== 'SuperAdmin';
    }

    navigateHome(): void {
        this.router.navigate(['/']);
    }

    getCreatedAtFormatted(createdAt: string): string {
        return new Date(createdAt).toLocaleDateString('sv-SE');
    }

    openAddUserDialog(): void {
        const dialogRef = this.dialog.open(AddUserDialogComponent);

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadUsers();
            }
        });
    }
}
