import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../services/supabase.js';
import { generateWithContext } from '../services/llm.js';
import { getQuote } from '../services/yahoo.js';
import { getNews } from '../services/news.js';

const router = Router();

const SYSTEM_PROMPT = `You are FinSight, an institutional-grade AI financial analyst.
Answer with data-backed insights. Always cite your sources inline. Be concise but thorough.
Format responses in clear sections. Flag speculation clearly.`;

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { message, conversationId, tickers = [] } = req.body;
    const userId = req.user.sub;

    // Fetch live context for mentioned tickers
    const contextParts = await Promise.all(
      tickers.map(async (t) => {
        const [quote, news] = await Promise.all([getQuote(t), getNews(t)]);
        return `${t}: Price $${quote.regularMarketPrice}, Change ${quote.regularMarketChangePercent?.toFixed(2)}%\nTop news: ${news.slice(0, 3).map((n) => n.title).join('; ')}`;
      })
    );

    const answer = await generateWithContext(
      SYSTEM_PROMPT,
      message,
      contextParts.join('\n\n') || 'No specific ticker context provided.'
    );

    // Persist conversation
    let convId = conversationId;
    if (!convId) {
      const { data } = await supabase
        .from('conversations')
        .insert({ user_id: userId, title: message.slice(0, 60) })
        .select('id')
        .single();
      convId = data.id;
    }

    await supabase.from('messages').insert([
      { conversation_id: convId, role: 'user', content: message },
      { conversation_id: convId, role: 'assistant', content: answer },
    ]);

    res.json({ answer, conversationId: convId });
  } catch (err) { next(err); }
});

router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const { data } = await supabase
      .from('conversations')
      .select('id, title, created_at')
      .eq('user_id', req.user.sub)
      .order('created_at', { ascending: false })
      .limit(20);
    res.json(data);
  } catch (err) { next(err); }
});

router.get('/:id/messages', requireAuth, async (req, res, next) => {
  try {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', req.params.id)
      .order('created_at');
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
