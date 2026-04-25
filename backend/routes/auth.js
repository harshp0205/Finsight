import { Router } from 'express';
import { supabase } from '../services/supabase.js';

const router = Router();

// Supabase handles OAuth flows on the client side.
// These endpoints are utility/server-side helpers.

router.get('/me', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error: error.message });
    res.json(user);
  } catch (err) { next(err); }
});

export default router;
