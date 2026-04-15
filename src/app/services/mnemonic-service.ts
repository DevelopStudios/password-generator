import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const WORD_MAP: Record<string, string> = {
  a: 'agile', b: 'brave', c: 'clever', d: 'daring', e: 'eager',
  f: 'fierce', g: 'grand', h: 'happy', i: 'icy', j: 'jolly',
  k: 'keen', l: 'lively', m: 'mighty', n: 'noble', o: 'old',
  p: 'proud', q: 'quick', r: 'rapid', s: 'swift', t: 'tall',
  u: 'unique', v: 'vivid', w: 'wild', x: 'exact', y: 'young', z: 'zealous',
};

export interface WordEntry {
  char: string;
  word: string;
}

@Injectable({ providedIn: 'root' })
export class MnemonicService {
  private worker: Worker | null = null;
  private modelLoadStarted = false;

  public progress$ = new BehaviorSubject<number>(0);
  public wordMap$ = new BehaviorSubject<WordEntry[]>([]);
  public scene$ = new BehaviorSubject<string>('');
  public isReady$ = new BehaviorSubject<boolean>(false);
  public isGeneratingScene$ = new BehaviorSubject<boolean>(false);

  readonly isWebGPUSupported = typeof navigator !== 'undefined' && 'gpu' in navigator;

  constructor() {
    if (typeof Worker !== 'undefined' && this.isWebGPUSupported) {
      this.worker = new Worker(new URL('../mnemonic.worker', import.meta.url));

      this.worker.onmessage = ({ data }) => {
        switch (data.type) {
          case 'progress':
            this.progress$.next(data.progress);
            break;
          case 'ready':
            this.isReady$.next(true);
            break;
          case 'token':
            this.scene$.next(this.scene$.getValue() + data.token);
            break;
          case 'result':
            this.isGeneratingScene$.next(false);
            break;
          case 'error':
            this.isGeneratingScene$.next(false);
            break;
        }
      };
    }
  }

  loadModel() {
    if (!this.isWebGPUSupported || this.modelLoadStarted) return;
    this.modelLoadStarted = true;
    this.worker?.postMessage({
      type: 'load',
      modelId: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    });
  }

  generateStory(password: string) {
    // Always compute word map instantly — deterministic, no LLM needed
    const wordMap = this.buildWordMap(password);
    this.wordMap$.next(wordMap);
    this.scene$.next('');

    if (!this.isWebGPUSupported || !this.isReady$.getValue()) return;

    // LLM generates a vivid scene from the word list
    const wordList = wordMap.map(e => e.word).join(', ');
    this.isGeneratingScene$.next(true);
    this.worker?.postMessage({ type: 'generate', wordList });
  }

  private buildWordMap(password: string): WordEntry[] {
    return password.split('').map(char => {
      let word: string;
      if (/[a-z]/.test(char)) word = WORD_MAP[char] ?? char;
      else if (/[A-Z]/.test(char)) word = (WORD_MAP[char.toLowerCase()] ?? char).toUpperCase();
      else if (/[0-9]/.test(char)) word = char;
      else if (char === ' ') word = 'the';
      else word = `${char} (${this.symbolMeaning(char)})`;
      return { char, word };
    });
  }

  private symbolMeaning(char: string): string {
    const meanings: Record<string, string> = {
      '!': 'bang', '@': 'at', '#': 'hash', '$': 'dollar', '%': 'percent',
      '^': 'caret', '&': 'and', '*': 'star', '(': 'open', ')': 'close',
      '_': 'under', '+': 'plus', '-': 'dash', '=': 'equals', '?': 'question',
    };
    return meanings[char] ?? 'symbol';
  }
}
