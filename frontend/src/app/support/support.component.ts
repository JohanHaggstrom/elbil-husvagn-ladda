import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
    selector: 'app-support',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule],
    templateUrl: './support.component.html',
    styleUrl: './support.component.scss'
})
export class SupportComponent {
    private router = inject(Router);

    goBack(): void {
        this.router.navigate(['/']);
    }
}
