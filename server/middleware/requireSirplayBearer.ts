import jwt from 'jsonwebtoken';
import { SIRPLAY_VERIFY_MODE } from '../config/sirplay.js';

export function requireSirplayBearerVerified(req: any, res: any, next: any) {
  const auth: string | undefined = (req.headers?.authorization || req.headers?.Authorization) as any;

  if (!auth || typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing_bearer' });
  }

  const token = auth.slice('Bearer '.length).trim();
  if (!token) return res.status(401).json({ error: 'missing_bearer' });

  // DEV / RELAXED MODE: decode without verify, require uid field
  if (SIRPLAY_VERIFY_MODE === 'relaxed') {
    try {
      const decoded: any = jwt.decode(token, { json: true });
      if (!decoded || !decoded.uid) {
        return res.status(401).json({ error: 'invalid_token_payload' });
      }
      req.sirplayUser = decoded;
      req.sirplayToken = token;
      return next();
    } catch {
      return res.status(401).json({ error: 'invalid_token' });
    }
  }

  // PROD / STRICT MODE: verification not configured yet
  return res.status(401).json({
    error: 'sirplay_token_not_verified',
    hint: 'strict verification not configured'
  });
}
