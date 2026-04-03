/// <reference lib="webworker" />
import { MLCEngine, CreateMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";

let engine: MLCEngine | null = null;

addEventListener('message', async ({ data }) => {
  const { type, password, modelId } = data;

  if (type === 'load') {
    try {
      engine = await CreateMLCEngine(modelId, {
        appConfig: prebuiltAppConfig,
        initProgressCallback: (report) => {
          postMessage({ type: 'progress', progress: report.progress });
        }
      });
      postMessage({ type: 'ready' });
    } catch (error) {
      console.error("WebLLM Load Error:", error);
    }
  }

  if (type === 'generate' && engine) {
    // Pre-process the password to create a strict sequence of requirements
    const passwordChars = password.split('');
    const charBreakdown = passwordChars.map((char: string, i: number) => {
      let requirement = 'lowercase word';
      if (char === ' ') requirement = 'Short connecting word (the/a/of/in)';
      else if (char === '_') requirement = 'Preposition (under/through/across)';
      else if (/[A-Z]/.test(char)) requirement = 'Name, Role, or Proper Noun starting with this letter';
      else if (/[0-9]/.test(char)) requirement = 'The number itself';
      else if (/[!@#$%^&*()_+[\]{}|;:,.<>?]/.test(char)) requirement = 'The symbol itself followed by a meaning in parentheses, e.g. "! (loudly)"';
      
      return `${i + 1}. "${char}": Use a ${requirement}`;
    }).join('\n');

    const prompt = `You are a security assistant. Generate a cohesive mnemonic for the password: "${password}"

RULES:
1. [Sentence]: One cohesive story using exactly one word or element for EVERY character in the order provided below.
2. For symbols/numbers, use the format: char (meaning).
3. [Visual]: A one-sentence scene describing the action in the [Sentence].

EXAMPLE:
Password: "K9! XP_7"
Character Requirements:
1. "K": Name/Role
2. "9": Number
3. "!": Symbol (meaning)
4. " ": Connection
5. "X": word starting with X
6. "P": Proper noun
7. "_": Preposition
8. "7": Number
[Sentence]: King 9! (loudly) eXited the Palace - (under) 7.
[Visual]: A King shouting as he leaves through a hidden bunker.

YOUR TASK:
Character Requirements:
${charBreakdown}

[Sentence]:`;
    
    const reply = await engine.chat.completions.create({
      messages: [
        { role: "system", content: "You strictly follow character sequences to create mnemonics." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2, // Low temperature for high predictability and accuracy
      max_tokens: 250
    });

    // Re-prepend the tag if the model started generating immediately
    const content = reply.choices[0].message.content || '';
    const story = content.startsWith('[Sentence]:') ? content : `${content}`;
    postMessage({ type: 'result', story });
  }
});