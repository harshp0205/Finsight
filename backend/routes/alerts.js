import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../services/supabase.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', req.user.sub)
      .order('created_at', { ascending: false });
    res.json(data);
  } catch (err) { next(err); }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { ticker, condition } = req.body;
    const { data } = await supabase
      .from('alerts')
      .insert({ user_id: req.user.sub, ticker, condition })
      .select()
      .single();
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await supabase.from('alerts').delete().eq('id', req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

export default router;
