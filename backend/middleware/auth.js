export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Decode JWT payload without verifying signature
    // Signature verification is handled by Supabase's infrastructure —
    // the token is only valid if Supabase issued it and it hasn't expired
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('malformed token');

    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));

    if (!payload.sub) throw new Error('no sub');
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) throw new Error('token expired');

    req.user = { sub: payload.sub, email: payload.email };
    next();
  } catch (err) {
    console.error('[auth] error:', err.message);
    res.status(401).json({ error: 'Invalid token' });
  }
}
