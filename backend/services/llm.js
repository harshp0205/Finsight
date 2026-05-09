import { GoogleGenerativeAI } from '@google/generative-ai';

let _genAI;

function getGenAI() {
  if (!_genAI) _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return _genAI;
}

export function getLLM() {
  return getGenAI().getGenerativeModel({ model: 'gemini-2.0-flash' });
}

export function getEmbeddingModel() {
  return getGenAI().getGenerativeModel({ model: 'text-embedding-004' });
}

export async function embedText(text) {
  const model = getEmbeddingModel();
  const result = await model.embedContent(text);
  return result.embedding.values;
}

export async function generateWithContext(systemPrompt, userMessage, context) {
  const model = getLLM();
  const fullPrompt = `${systemPrompt}\n\n--- CONTEXT ---\n${context}\n--- END CONTEXT ---\n\nUser: ${userMessage}`;
  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}
