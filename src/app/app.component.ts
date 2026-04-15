import { AfterViewInit, Component, inject, signal } from '@angular/core';
import { SliderComponent } from './components/slider/slider.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MnemonicService } from './services/mnemonic-service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap, filter, of } from 'rxjs';
import { MnemonicCard } from './components/mnemonic-card/mnemonic-card';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SliderComponent, FormsModule, CommonModule, MnemonicCard],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  /** Application title used in metadata. */
  public title = 'password-generator';

  /** Tracks the loading progress (0-100) of the AI Mnemonic model. */
  public loadProgress = 0;

  /** The desired length of the password, controlled by the slider. */
  public mySliderValue = signal(9);

  /** The resulting generated password string. */
  public generatedPassword = signal('');

  /** User-friendly text describing the password strength. */
  public passwordStrengthText = signal('MEDIUM');

  /** Numerical level (1-4) representing the visual strength bars. */
  public strengthLevel = signal(2);

  /** CSS variable string for the strength bar colors. */
  public strengthBarColor = signal('var(--color-medium-strength)');

  /** Signals representing user preferences for character types. */
  public includeUppercase = signal(false);
  public includeLowercase = signal(false);

  /** Service for AI-powered mnemonic generation. */
  public mnemonicService = inject(MnemonicService);

  /** Tracks if the AI model is ready to generate scenes. */
  public isModelReady = toSignal(this.mnemonicService.isReady$, { initialValue: false });
  /** Word map: deterministic char → word pairs, always available instantly. */
  public wordMap = toSignal(this.mnemonicService.wordMap$, { initialValue: [] });
  /** The LLM-generated scene description. */
  public mnemonicScene = toSignal(this.mnemonicService.scene$, { initialValue: '' });
  /** Tracks if the LLM is currently generating a scene. */
  public isGeneratingScene = toSignal(this.mnemonicService.isGeneratingScene$, { initialValue: false });
  public includeNumbers = signal(false);
  public includeSymbols = signal(false);

  /** Visibility state for the "COPIED" feedback text. */
  public isCopied = signal(false);

  /** Constant character pools for password generation. */
  private readonly uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private readonly lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  private readonly numberChars = '0123456789';
  private readonly symbolsChars = '!@#$%^&*()_+[]{}|;:,.<>?';

  constructor() {
    this.mnemonicService.progress$.subscribe(p => this.loadProgress = p * 100);
    this.mnemonicService.isReady$.subscribe(value => {
      if (value) this.mnemonicService.generateStory(this.generatedPassword());
    });

    // Reactively trigger story generation when the password changes
    toObservable(this.generatedPassword)
      .pipe(
        filter(password => password.length > 0),
        debounceTime(1000),
        distinctUntilChanged(),
        switchMap(password => {
          // Lazy-load the model on first password change — only if WebGPU is available
          this.mnemonicService.loadModel();
          this.mnemonicService.generateStory(password);
          return of(null);
        })
      )
      .subscribe();

    // Generate an initial password on component load
    this.generatePassword();
  }

   /**
   * Generates a password based on selected criteria and updates the UI.
   * This method will be called when the "GENERATE" button is clicked.
   */
  public generatePassword(): void {
    const selection = this.getSelectionConfig();
    let charSet = selection.pool;
    let newPassword = selection.guaranteed;

    const desiredLength = this.mySliderValue();
    const remainingLength = desiredLength - newPassword.length;

    if (remainingLength < 0) {
      newPassword = newPassword.substring(0, desiredLength);
    } else {
      for (let i = 0; i < remainingLength; i++) {
        newPassword += this.getRandomChar(charSet);
      }
    }

    newPassword = this.shuffleString(newPassword);
    this.generatedPassword.set(newPassword);
    this.updateStrength(newPassword);
  }
 
  /**
   * Compiles the character pool and guaranteed characters based on user selection.
   * @returns An object containing the full pool and a string of guaranteed characters.
   */
  private getSelectionConfig(): { pool: string, guaranteed: string } {
    let pool = '';
    let guaranteed = '';

    if (this.includeUppercase()) {
      pool += this.uppercaseChars;
      guaranteed += this.getRandomChar(this.uppercaseChars);
    }
    if (this.includeLowercase()) {
      pool += this.lowercaseChars;
      guaranteed += this.getRandomChar(this.lowercaseChars);
    }
    if (this.includeNumbers()) {
      pool += this.numberChars;
      guaranteed += this.getRandomChar(this.numberChars);
    }
    if (this.includeSymbols()) {
      pool += this.symbolsChars;
      guaranteed += this.getRandomChar(this.symbolsChars);
    }

    // Default to lowercase if nothing is selected
    if (!pool) {
      pool = this.lowercaseChars;
      this.includeLowercase.set(true);
      guaranteed += this.getRandomChar(this.lowercaseChars);
    }

    return { pool, guaranteed };
  }

  /** Returns a single random character from a given charset. */
  private getRandomChar(charset: string): string {
    const randomIndex = Math.floor(Math.random() * charset.length);
    return charset.charAt(randomIndex);
  }

  /** Shuffles a string using the Fisher-Yates algorithm. */
  private shuffleString(str: string): string {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }

  /**
   * Analyzes the provided password and updates UI strength signals.
   * @param password The password to evaluate.
   */
  public updateStrength(password: string): void {
    // Sync UI controls to reflect the actual content of the password
    this.includeUppercase.set(/[A-Z]/.test(password));
    this.includeLowercase.set(/[a-z]/.test(password));
    this.includeNumbers.set(/[0-9]/.test(password));
    this.includeSymbols.set(/[!@#$%^&*()_+[\]{}|;:,.<>?]/.test(password));
    this.mySliderValue.set(password.length);

    const typeCount = this.calculateTypeDiversity(password);
    const score = this.calculateStrengthScore(password.length, typeCount);
    this.applyStrengthToUI(score);
  }

  /** Counts how many different character categories are present in the password. */
  private calculateTypeDiversity(password: string): number {
    let count = 0;
    if (/[A-Z]/.test(password)) count++;
    if (/[a-z]/.test(password)) count++;
    if (/[0-9]/.test(password)) count++;
    if (/[!@#$%^&*()_+[\]{}|;:,.<>?]/.test(password)) count++;
    return count;
  }

  /**
   * Heuristic to determine strength score (0-4).
   */
  private calculateStrengthScore(length: number, typeCount: number): number {
    if (length < 6) {
      return 0;
    } else if (length < 8 && typeCount < 2) {
      return 1;
    } else if (length < 10 && typeCount < 3) {
      return 2;
    } else if (length < 12 && typeCount < 4) {
      return 3;
    } else if (length >= 12 && typeCount >= 3) {
      return 4;
    }
    return 2;
  }

  /** Updates the visual signals based on the calculated score. */
  private applyStrengthToUI(score: number): void {
    switch (score) {
      case 0:
        this.passwordStrengthText.set('TOO WEAK!');
        this.strengthLevel.set(1); // 1 bar filled
        this.strengthBarColor.set('var(--color-too-weak-strength)');
        break;
      case 1:
        this.passwordStrengthText.set('WEAK');
        this.strengthLevel.set(2); // 2 bars filled
        this.strengthBarColor.set('var(--color-weak-strength)');
        break;
      case 2:
        this.passwordStrengthText.set('MEDIUM');
        this.strengthLevel.set(3); // 3 bars filled
        this.strengthBarColor.set('var(--color-medium-strength)');
        break;
      case 3:
      case 4:
        this.passwordStrengthText.set('STRONG');
        this.strengthLevel.set(4); // 4 bars filled
        this.strengthBarColor.set('var(--color-strong-strength)');
        break;
      default: // Fallback
        this.passwordStrengthText.set('WEAK');
        this.strengthLevel.set(2);
        this.strengthBarColor.set('var(--color-weak-strength)');
        break;
    }
  }

  /** Copies the current generated password to the system clipboard. */
  public copyToClipboard(): void {
    navigator.clipboard.writeText(this.generatedPassword()).then(() => {
        this.isCopied.set(true);
        setTimeout(() => {
          this.isCopied.set(false);
        }, 2000);
    }).catch(err => {
        console.error('Clipboard copy failed:', err);
        alert('Failed to copy password. Please copy manually.');
    });
  }
}
