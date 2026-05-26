import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MnemonicCard } from './mnemonic-card';
import { WordEntry } from '../../services/mnemonic-service';

describe('MnemonicCard', () => {
  let component: MnemonicCard;
  let fixture: ComponentFixture<MnemonicCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MnemonicCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MnemonicCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render word map entries', () => {
    const wordMap: WordEntry[] = [
      { char: 'a', word: 'agile' },
      { char: 'b', word: 'brave' }
    ];
    fixture.componentRef.setInput('wordMap', wordMap);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const wordPairs = compiled.querySelectorAll('.word-pair');
    expect(wordPairs.length).toBe(2);
    expect(wordPairs[0].textContent).toContain('aagile');
    expect(wordPairs[1].textContent).toContain('bbrave');
  });

  it('should render scene when not loading', () => {
    fixture.componentRef.setInput('scene', 'A hero is born.');
    fixture.componentRef.setInput('isLoading', false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.visual-footer')?.textContent).toContain('A hero is born.');
    expect(compiled.querySelector('.skeleton-visual')).toBeNull();
  });

  it('should render skeleton loader when isLoading is true', () => {
    fixture.componentRef.setInput('isLoading', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.skeleton-visual')).toBeTruthy();
  });
});
