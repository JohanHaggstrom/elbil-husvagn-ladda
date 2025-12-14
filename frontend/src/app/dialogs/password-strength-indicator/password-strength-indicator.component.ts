import { CommonModule } from '@angular/common';
import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
    inject,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../../services/user.service';

interface PasswordRequirement {
    name: string;
    met: boolean;
}

@Component({
    selector: 'app-password-strength-indicator',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './password-strength-indicator.component.html',
    styleUrl: './password-strength-indicator.component.scss',
})
export class PasswordStrengthIndicatorComponent implements OnInit, OnChanges {
    @Input() password: string = '';
    @Output() validityChange = new EventEmitter<boolean>();

    private userService = inject(UserService);

    requirements: PasswordRequirement[] = [
        { name: 'Minst 8 tecken', met: false },
        { name: 'Versaler (A-Z)', met: false },
        { name: 'Gemener (a-z)', met: false },
        { name: 'Siffror (0-9)', met: false },
        { name: 'Specialtecken (!@#$%^&*)', met: false },
    ];

    isValid = false;

    ngOnInit() {
        this.validatePassword();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['password']) {
            this.validatePassword();
        }
    }

    async validatePassword(): Promise<void> {
        if (!this.password) {
            this.resetRequirements();
            return;
        }

        try {
            const result = await firstValueFrom(
                this.userService.validatePassword(this.password)
            );

            this.requirements[0].met = result.hasMinLength;
            this.requirements[1].met = result.hasUppercase;
            this.requirements[2].met = result.hasLowercase;
            this.requirements[3].met = result.hasDigits;
            this.requirements[4].met = result.hasSpecialCharacters;

            this.isValid = result.isValid;
            this.validityChange.emit(this.isValid);
        } catch (error) {
            console.error('Error validating password:', error);
        }
    }

    private resetRequirements(): void {
        this.requirements.forEach((req) => (req.met = false));
        this.isValid = false;
    }
}
