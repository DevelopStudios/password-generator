import { AfterViewInit, Component, signal} from '@angular/core';
import { SliderComponent } from './components/slider/slider.component';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SliderComponent,FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {
  title = 'password-generator';
  mySliderValue = signal(9);
  generatedPassword = signal('');
  passwordStrengthText = signal('MEDIUM');
  strengthLevel = signal(2);
  strengthBarColor = signal('var(--color-medium-strength)')
  //Signals for checkbox states
  includeUppercase = signal(false);
  includeLowercase = signal(false);
  includeNumbers = signal(false);
  includeSymbols = signal(false);

  //Singnal to control  "COPIED" text visibility
  isCopied = signal(false);

  // --- Character Sets ---
  private readonly uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private readonly lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  private readonly numberChars = '0123456789';
  private readonly symbolsChars = '!@#$%^&*()_+[]{}|;:,.<>?';

  constructor(){
    this.generatedPassword();
  }
  ngAfterViewInit(): void {  
  
  }

   /**
   * Generates a password based on selected criteria and updates the UI.
   * This method will be called when the "GENERATE" button is clicked.
   */
  generatePassword() {
   let charSet = '';
   let guaranteedChars: string[]=[];

   //Build the character set and add guaranteed characters
   if(this.includeUppercase()){
    charSet += this.uppercaseChars;
    guaranteedChars.push(this.getRandomChar(this.uppercaseChars));
   }
   if(this.includeLowercase()){
    charSet += this.lowercaseChars;
    guaranteedChars.push(this.getRandomChar(this.lowercaseChars));
   }
   if(this.includeNumbers()){
    charSet += this.numberChars;
    guaranteedChars.push(this.getRandomChar(this.numberChars));
   }
   if(this.includeSymbols()){
    charSet += this.symbolsChars;
    guaranteedChars.push(this.getRandomChar(this.symbolsChars));
   }

   //If no character types are selected, default to lowercase
   if(charSet === ''){
    charSet = this.lowercaseChars;
    this.includeLowercase.set(true);//Update checkbox
    guaranteedChars.push(this.getRandomChar(this.lowercaseChars));
   }

   let newPassword = guaranteedChars.join('');

   //Determine remaining length to fill the password
   const desiredLength = this.mySliderValue();
   const remainingLength = desiredLength - newPassword.length;

   //Regative remaing char check
   if(remainingLength < 0){
    newPassword = newPassword.substring(0, desiredLength);
   } else {
    // Fill rest of password length with random char
    for(let i = 0;i < remainingLength;i ++){
      newPassword += this.getRandomChar(charSet);
    }
   }

   newPassword = this.shuffleString(newPassword);

   this.generatedPassword.set(newPassword);
   this.updateStrength(newPassword);
  }

  //Helper functions
  private getRandomChar(charset: string): string {
    const randomIndex = Math.floor(Math.random() * charset.length);
    return charset.charAt(randomIndex);
  }

  private shuffleString(str: string): string {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j],arr[i]]; //swap elements
    }
    return arr.join('');
  }

  updateStrength(password: string): void {
    let score = 0;

    // A more sophisticated scoring based on character types presence
    let hasUppercase = /[A-Z]/.test(password);
    let hasLowercase = /[a-z]/.test(password);
    let hasNumbers = /[0-9]/.test(password);
    let hasSymbols = /[!@#$%^&*()_+[\]{}|;:,.<>?]/.test(password);

    let typeCount = 0;
    if (hasUppercase) typeCount++;
    if (hasLowercase) typeCount++;
    if (hasNumbers) typeCount++;
    if (hasSymbols) typeCount++;

    // Basic scoring based on length and character type diversity
    if (password.length < 6) { // Very short passwords are too weak
      score = 0;
    } else if (password.length < 8 && typeCount < 2) { // Short, simple passwords
      score = 1; // Too Weak
    } else if (password.length < 10 && typeCount < 3) { // Weak to medium
      score = 2; // Weak
    } else if (password.length < 12 && typeCount < 4) { // Medium to good
      score = 3; // Medium
    } else if (password.length >= 12 && typeCount >= 3) { // Good to excellent
      score = 4; // Strong
    } else {
      score = 2; // Default for cases not explicitly covered, adjust as needed
    }


    // Set strength text, level, and color based on score/conditions
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
      case 4: // Consider score 4 as well for strong, adjust thresholds as needed
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

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.generatedPassword()).then(() => {
        this.isCopied.set(true);
        setTimeout(()=>{
          this.isCopied.set(false);
        }, 2000);
    }).catch(err => {
        alert('Failed to copy password. Please try again or copy manually');
    });
  }

}
