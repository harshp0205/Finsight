import Groq from 'groq-sdk';

// ── Groq (active) ─────────────────────────────────────────────
// Free tier: 14,400 req/day, 6,000 tokens/min
// Model: llama-3.3-70b-versatile — best open model for financial reasoning
let _groq;
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

const GROQ_MODEL = 'llama-3.3-70b-versatile';

export function getLLM() {
  return getGroq();
}

function buildMessages(systemPrompt, userMessage, context) {
  const messages = [{ role: 'system', content: systemPrompt }];
  if (context && context !== 'No market data available for this query.') {
    messages.push({
      role: 'user',
      content: `Here is the live market data retrieved right now:\n\n${context}\n\nBased on this data, answer: ${userMessage}`,
    });
  } else {
    messages.push({ role: 'user', content: userMessage });
  }
  return messages;
}

// Non-streaming completion
export async function generateWithContext(systemPrompt, userMessage, context) {
  const groq = getGroq();
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: buildMessages(systemPrompt, userMessage, context),
    temperature: 0.3,
    max_tokens: 1024,
  });
  return completion.choices[0].message.content;
}

// Streaming — returns async iterable of chunks
export async function* streamCompletion(systemPrompt, userMessage, context) {
  const groq = getGroq();
  const stream = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: buildMessages(systemPrompt, userMessage, context),
    temperature: 0.3,
    max_tokens: 1024,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || '';
    if (text) yield text;
  }
}

// ── Gemini embeddings (still used for pgvector RAG) ───────────
// Groq doesn't provide embeddings — Gemini text-embedding-004 stays for this
import { GoogleGenerativeAI } from '@google/generative-ai';

let _genAI;
function getGenAI() {
  if (!_genAI) _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return _genAI;
}

export function getEmbeddingModel() {
  return getGenAI().getGenerativeModel({ model: 'text-embedding-004' });
}

export async function embedText(text) {
  const model = getEmbeddingModel();
  const result = await model.embedContent(text);
  return result.embedding.values;
}
