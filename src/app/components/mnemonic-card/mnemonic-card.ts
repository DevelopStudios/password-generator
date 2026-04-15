import { Component, input } from '@angular/core';
import { WordEntry } from '../../services/mnemonic-service';

@Component({
  selector: 'app-mnemonic-card',
  imports: [],
  templateUrl: './mnemonic-card.html',
  styleUrl: './mnemonic-card.scss',
})
export class MnemonicCard {
  public wordMap = input<WordEntry[]>([]);
  public scene = input<string>('');
  public isLoading = input<boolean>(false);
}
