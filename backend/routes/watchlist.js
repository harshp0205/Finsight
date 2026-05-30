import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../services/supabase.js';
import { resolveTicker } from '../utils/resolveTicker.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('watchlists')
      .select('id, ticker')
      .eq('user_id', req.user.sub);
    if (error) throw new Error(error.message);
    res.json(data || []);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const ticker = resolveTicker(req.body.ticker);
    const { data, error } = await supabase
      .from('watchlists')
      .insert({ user_id: req.user.sub, ticker })
      .select()
      .single();
    if (error) throw new Error(error.message);
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await supabase.from('watchlists').delete().eq('id', req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
