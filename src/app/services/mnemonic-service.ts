import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MnemonicService {
  private worker: Worker | null = null;
  public progress$ = new BehaviorSubject<number>(0);
  public story$ = new BehaviorSubject<string>('');
  public isReady$ = new BehaviorSubject<boolean>(false);
  public isGeneratingStory$ = new BehaviorSubject<boolean>(false);

  constructor() {
    if (typeof Worker !== 'undefined') {
      // Initialize the worker
      this.worker = new Worker(new URL('../mnemonic.worker', import.meta.url));
      
      this.worker.onmessage = ({ data }) => {
        switch (data.type) {
          case 'progress':
            this.progress$.next(data.progress);
            break;
          case 'ready':
            this.isReady$.next(true);
            break;
          case 'result':
            this.story$.next(data.story);
            this.isGeneratingStory$.next(false);
            break;
        }
      };
    }
  }

  loadModel() {
    this.worker?.postMessage({ 
      type: 'load', 
      modelId: 'Qwen2.5-3B-Instruct-q4f16_1-MLC',
    });
  }

  generateStory(password: string) {
    this.story$.next(''); // Clear previous story
    this.isGeneratingStory$.next(true);
    this.worker?.postMessage({ type: 'generate', password });
  }
}