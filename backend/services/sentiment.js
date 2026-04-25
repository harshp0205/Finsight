import { getLLM } from './llm.js';

export async function scoreSentiment(texts) {
  if (!texts.length) return { score: 0, label: 'neutral' };
  const model = getLLM();
  const prompt = `Rate the overall financial sentiment of these headlines from -1 (very bearish) to 1 (very bullish). Return JSON only: {"score": number, "label": "bullish"|"neutral"|"bearish"}\n\nHeadlines:\n${texts.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const json = text.match(/\{[\s\S]*\}/)?.[0];
  return json ? JSON.parse(json) : { score: 0, label: 'neutral' };
}
