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
      // Log available model IDs to help you find the correct string
      const availableIds = prebuiltAppConfig.model_list.map(m => m.model_id);
      console.log("Valid Model IDs for this version:", availableIds);
    }
  }

  if (type === 'generate' && engine) {
    const prompt = `Create a memorable sentence where each word starts with these characters: ${password.split('').join(', ')}. Use the symbol meanings if possible. Keep it short.`;
    
    const reply = await engine.chat.completions.create({
      messages: [{ role: "user", content: prompt }]
    });

    postMessage({ type: 'result', story: reply.choices[0].message.content });
  }
});