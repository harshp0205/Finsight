import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../services/supabase.js';
import { streamPipeline } from '../rag/pipeline.js';

const router = Router();

// POST /api/chat — SSE streaming response
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user.sub;

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Load conversation history
    let convId = conversationId;
    let history = [];

    if (convId) {
      const { data } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', convId)
        .order('created_at')
        .limit(10);
      history = data || [];
    }

    // Stream pipeline
    let fullAnswer = '';
    let metaData = {};

    for await (const event of streamPipeline(message, history)) {
      if (event.type === 'chunk') {
        fullAnswer += event.text;
        sendEvent('chunk', { text: event.text });
      } else if (event.type === 'done') {
        metaData = { citations: event.citations, intent: event.intent, ticker: event.ticker };
        sendEvent('done', metaData);
      }
    }

    // Persist conversation
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
      { conversation_id: convId, role: 'assistant', content: fullAnswer, citations: metaData.citations },
    ]);

    sendEvent('conversationId', { id: convId });
    res.end();
  } catch (err) {
    // SSE headers already sent — can't use normal error handler
    if (res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
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
