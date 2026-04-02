import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MnemonicService {
  private worker: Worker | null = null;
  public progress$ = new BehaviorSubject<number>(0);
  public story$ = new BehaviorSubject<string>('');
  public isReady$ = new BehaviorSubject<boolean>(false);

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
            break;
        }
      };
    }
  }

  loadModel() {
    this.worker?.postMessage({ 
      type: 'load', 
      modelId: 'SmolLM2-135M-Instruct-q0f16-MLC' 
    });
  }

  generateStory(password: string) {
    this.worker?.postMessage({ type: 'generate', password });
  }
}