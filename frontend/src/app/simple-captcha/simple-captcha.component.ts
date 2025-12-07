import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-simple-captcha',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule
    ],
    templateUrl: './simple-captcha.component.html',
    styleUrl: './simple-captcha.component.scss'
})
export class SimpleCaptchaComponent implements OnInit {
    @Output() captchaValid = new EventEmitter<boolean>();

    num1 = 0;
    num2 = 0;
    userAnswer = '';
    isValid = false;

    ngOnInit() {
        this.generateCaptcha();
    }

    generateCaptcha() {
        this.num1 = Math.floor(Math.random() * 10) + 1;
        this.num2 = Math.floor(Math.random() * 10) + 1;
        this.userAnswer = '';
        this.isValid = false;
        this.captchaValid.emit(false);
    }

    checkAnswer() {
        const correctAnswer = this.num1 + this.num2;
        this.isValid = parseInt(this.userAnswer) === correctAnswer;
        this.captchaValid.emit(this.isValid);
    }

    refresh() {
        this.generateCaptcha();
    }
}
