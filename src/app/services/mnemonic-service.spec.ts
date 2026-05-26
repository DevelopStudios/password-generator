import { TestBed } from '@angular/core/testing';
import { MnemonicService } from './mnemonic-service';

describe('MnemonicService', () => {
  let service: MnemonicService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MnemonicService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should build a word map correctly for lowercase letters', () => {
    const password = 'abc';
    service.generateStory(password);
    const wordMap = service.wordMap$.getValue();
    expect(wordMap.length).toBe(3);
    expect(wordMap[0]).toEqual({ char: 'a', word: 'agile' });
    expect(wordMap[1]).toEqual({ char: 'b', word: 'brave' });
    expect(wordMap[2]).toEqual({ char: 'c', word: 'clever' });
  });

  it('should build a word map correctly for uppercase letters', () => {
    const password = 'ABC';
    service.generateStory(password);
    const wordMap = service.wordMap$.getValue();
    expect(wordMap.length).toBe(3);
    expect(wordMap[0]).toEqual({ char: 'A', word: 'AGILE' });
    expect(wordMap[1]).toEqual({ char: 'B', word: 'BRAVE' });
    expect(wordMap[2]).toEqual({ char: 'C', word: 'CLEVER' });
  });

  it('should handle numbers in the word map', () => {
    const password = '123';
    service.generateStory(password);
    const wordMap = service.wordMap$.getValue();
    expect(wordMap[0]).toEqual({ char: '1', word: '1' });
  });

  it('should handle symbols with meanings', () => {
    const password = '!@';
    service.generateStory(password);
    const wordMap = service.wordMap$.getValue();
    expect(wordMap[0]).toEqual({ char: '!', word: '! (bang)' });
    expect(wordMap[1]).toEqual({ char: '@', word: '@ (at)' });
  });

  it('should handle spaces', () => {
    const password = ' ';
    service.generateStory(password);
    const wordMap = service.wordMap$.getValue();
    expect(wordMap[0]).toEqual({ char: ' ', word: 'the' });
  });
});
