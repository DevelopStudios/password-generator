/// <reference lib="webworker" />
import { MLCEngine, CreateMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";

let engine: MLCEngine | null = null;

addEventListener('message', async ({ data }) => {
  const { type, modelId, wordList } = data;

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
      postMessage({ type: 'error', message: 'Model failed to load' });
    }
  }

  if (type === 'generate' && engine) {
    const prompt = `Words: ${wordList}
Write one vivid sentence that uses these words as a memorable scene. Output only the sentence.`;

    try {
      const stream = await engine.chat.completions.create({
        messages: [
          { role: 'system', content: 'You write short vivid scenes from word lists. One sentence only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 80,
        stream: true
      });

      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content || '';
        if (token) postMessage({ type: 'token', token });
      }

      postMessage({ type: 'result' });
    } catch (error) {
      postMessage({ type: 'error', message: 'Generation failed' });
    }
  }
});
