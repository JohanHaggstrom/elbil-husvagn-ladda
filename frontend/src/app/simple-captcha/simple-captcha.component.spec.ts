import { TestBed } from '@angular/core/testing';
import { SimpleCaptchaComponent } from './simple-captcha.component';

describe('SimpleCaptchaComponent', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [SimpleCaptchaComponent],
        });
    });

    function create(): SimpleCaptchaComponent {
        const fixture = TestBed.createComponent(SimpleCaptchaComponent);
        fixture.detectChanges();
        return fixture.componentInstance;
    }

    it('generates two operands between 1 and 10 on init', () => {
        const c = create();
        expect(c.num1).toBeGreaterThanOrEqual(1);
        expect(c.num1).toBeLessThanOrEqual(10);
        expect(c.num2).toBeGreaterThanOrEqual(1);
        expect(c.num2).toBeLessThanOrEqual(10);
    });

    it('emits false on init', () => {
        const fixture = TestBed.createComponent(SimpleCaptchaComponent);
        const emitted: boolean[] = [];
        fixture.componentInstance.captchaValid.subscribe(v => emitted.push(v));
        fixture.detectChanges();
        expect(emitted).toEqual([false]);
    });

    it('marks valid and emits true when answer matches', () => {
        const c = create();
        const emitted: boolean[] = [];
        c.captchaValid.subscribe(v => emitted.push(v));

        c.userAnswer = String(c.num1 + c.num2);
        c.checkAnswer();

        expect(c.isValid).toBe(true);
        expect(emitted[emitted.length - 1]).toBe(true);
    });

    it('marks invalid and emits false when answer is wrong', () => {
        const c = create();
        const emitted: boolean[] = [];
        c.captchaValid.subscribe(v => emitted.push(v));

        c.userAnswer = String(c.num1 + c.num2 + 1);
        c.checkAnswer();

        expect(c.isValid).toBe(false);
        expect(emitted[emitted.length - 1]).toBe(false);
    });

    it('rejects non-numeric answers', () => {
        const c = create();
        c.userAnswer = 'abc';
        c.checkAnswer();
        expect(c.isValid).toBe(false);
    });

    it('refresh regenerates operands and resets state', () => {
        const c = create();
        c.userAnswer = '42';
        c.isValid = true;

        c.refresh();

        expect(c.userAnswer).toBe('');
        expect(c.isValid).toBe(false);
    });
});
