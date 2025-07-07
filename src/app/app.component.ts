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

  //Signals for checkbox states
  includeUppercase = signal(false);
  includeLowercase = signal(false);
  includeNumbers = signal(false);
  includeSymbols = signal(false);

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

  updateStrength(password:string):void{
    let score = 0;

    //Points for length 
    if(password.length >= 8) score += 1;
    if(password.length >= 12) score += 1;
    if(password.length >= 16) score += 1;

    //Points for different characters
     if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[!@#$%^&*()_+[\]{}|;:,.<>?]/.test(password)) score += 1;

       if (score < 3) {
      this.passwordStrengthText.set('WEAK');
      this.strengthLevel.set(1);
    } else if (score < 5) {
      this.passwordStrengthText.set('MEDIUM');
      this.strengthLevel.set(2);
    } else if (score < 7) {
      this.passwordStrengthText.set('GOOD');
      this.strengthLevel.set(3);
    } else {
      this.passwordStrengthText.set('EXCELLENT');
      this.strengthLevel.set(4);
    }
  }

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.generatedPassword()).then(() => {
      console.log('Password copied to clipboard!');
      // TODO: Implement a small visual feedback to the user, e.g., a temporary "Copied!" message
    }).catch(err => {
      console.error('Failed to copy password: ', err);
      // Fallback for older browsers or if permission is denied, or notify user of failure
    });
  }

}
