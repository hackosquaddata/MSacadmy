// Backend/src/middleware/auth.js
import { connectSupabase } from '../db/supabaseClient.js';

export const authenticate = async (req, res, next) => {
  try {
  const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

  const token = authHeader.split(' ')[1];

    // Guard against malformed tokens like 'undefined'/'null' or non-JWT strings
    const isValidJwt = typeof token === 'string' && token.split('.').length === 3 && !['undefined','null',''].includes(token);
    if (!isValidJwt) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Auth warning: Malformed token received');
      }
      return res.status(401).json({ message: 'Unauthorized - Invalid or malformed token' });
    }

    const supabase = connectSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (process.env.NODE_ENV === 'development') {
      console.log('Auth result:', { userId: user?.id, hasError: !!error });
    }

    if (error || !user) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth error:', error);
      }
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: "Authentication failed" });
  }
};