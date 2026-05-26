import { TestBed, ComponentFixture } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { MnemonicService } from './services/mnemonic-service';
import { BehaviorSubject, of } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mnemonicServiceMock: any;

  beforeEach(async () => {
    mnemonicServiceMock = {
      progress$: new BehaviorSubject(0),
      isReady$: new BehaviorSubject(false),
      wordMap$: new BehaviorSubject([]),
      scene$: new BehaviorSubject(''),
      isGeneratingScene$: new BehaviorSubject(false),
      loadModel: jasmine.createSpy('loadModel'),
      generateStory: jasmine.createSpy('generateStory')
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: MnemonicService, useValue: mnemonicServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should generate a password with correct length', () => {
    component.mySliderValue.set(12);
    component.generatePassword();
    expect(component.generatedPassword().length).toBe(12);
  });

  it('should include uppercase when selected', () => {
    component.includeUppercase.set(true);
    component.includeLowercase.set(false);
    component.includeNumbers.set(false);
    component.includeSymbols.set(false);
    component.generatePassword();
    expect(component.generatedPassword()).toMatch(/[A-Z]/);
  });

  it('should calculate strength correctly for short passwords', () => {
    component.updateStrength('abc');
    expect(component.passwordStrengthText()).toBe('TOO WEAK!');
    expect(component.strengthLevel()).toBe(1);
  });

  it('should calculate strength correctly for strong passwords', () => {
    component.updateStrength('Ab1!Ab1!Ab1!'); // Length 12, 4 types
    expect(component.passwordStrengthText()).toBe('STRONG');
    expect(component.strengthLevel()).toBe(4);
  });

  it('should sync criteria when updateStrength is called with isManualInput=true', () => {
    component.includeNumbers.set(false);
    component.updateStrength('123', true);
    expect(component.includeNumbers()).toBe(true);
  });

  it('should NOT sync criteria when updateStrength is called with isManualInput=false', () => {
    component.includeNumbers.set(false);
    component.updateStrength('123', false);
    expect(component.includeNumbers()).toBe(false);
  });

  it('should copy to clipboard', async () => {
    const spy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    component.generatedPassword.set('test-password');
    component.copyToClipboard();
    expect(spy).toHaveBeenCalledWith('test-password');
  });
});
