import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-mnemonic-card',
  imports: [],
  templateUrl: './mnemonic-card.html',
  styleUrl: './mnemonic-card.scss',
})
export class MnemonicCard {
  /** The raw AI-generated mnemonic story. */
  public story = input<string>('');

  /** The password string used to highlight relevant characters in the story. */
  public password = input<string>('');

  /** Whether the AI is currently generating the story. */
  public isLoading = input<boolean>(false);

  /** Parses the raw story string into a structured object for the template. */
  public parsedStory = computed(() => {
    const text = this.story();

    // Regex to extract content between [Sentence]: and [Visual]:
    const sentence = text.match(/\[Sentence\]:\s*(.*?)(?=\[Visual\]|$)/is)?.[1] || '';
    // Extract content after [Visual]: and strip potential trailing bracket from the signal log
    const visual = text.match(/\[Visual\]:\s*(.*)/is)?.[1]?.replace(/\]$/, '') || '';

    return {
      sentence: sentence.trim(),
      visual: visual.trim()
    };
  });

  /** Breaks the sentence into tokens with associated metadata for highlighting. */
  public tokens = computed(() => {
    const { sentence } = this.parsedStory();
    const pwd = this.password();
    
    if (!sentence) return [];

    // Split by spaces and parentheses to isolate words and meanings while preserving separators
    const rawParts = sentence.split(/(\s+|\(|\))/g).filter(p => p !== undefined && p !== '');
    
    const result: { text: string, class: string }[] = [];
    let pwdIdx = 0;
    let inParens = false;

    for (const part of rawParts) {
      if (part === '(') {
        inParens = true;
        result.push({ text: part, class: 'hl-mean' });
        continue;
      }
      if (part === ')') {
        inParens = false;
        result.push({ text: part, class: 'hl-mean' });
        continue;
      }
      if (inParens || part.trim() === '') {
        result.push({ text: part, class: inParens ? 'hl-mean' : '' });
        continue;
      }

      const char = pwd[pwdIdx];
      if (char && (part.toLowerCase().startsWith(char.toLowerCase()) || part.includes(char))) {
        const isSymbol = /[0-9!@#$%^&*()_+[\]{}|;:,.<>?]/.test(char);
        result.push({ text: part, class: isSymbol ? 'hl-sym' : 'hl-word' });
        pwdIdx++;
      } else {
        result.push({ text: part, class: '' });
      }
    }
    return result;
  });
}
