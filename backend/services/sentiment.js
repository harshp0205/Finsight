import { generateWithContext } from './llm.js';

export async function scoreSentiment(texts) {
  if (!texts.length) return { score: 0, label: 'neutral' };
  try {
    const prompt = `Rate the overall financial sentiment of these headlines from -1 (very bearish) to 1 (very bullish).
Return JSON only, no explanation: {"score": number, "label": "bullish"|"neutral"|"bearish"}

Headlines:
${texts.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;

    const result = await generateWithContext('You are a financial sentiment analyzer. Return only valid JSON.', prompt, '');
    const json = result.match(/\{[\s\S]*\}/)?.[0];
    return json ? JSON.parse(json) : { score: 0, label: 'neutral' };
  } catch {
    return { score: 0, label: 'neutral', error: 'sentiment unavailable' };
  }
}
