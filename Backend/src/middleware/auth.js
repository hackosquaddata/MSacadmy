// Backend/src/middleware/auth.js
import { connectSupabase } from '../db/supabaseClient.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader); // Debug log

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized - No token provided" });
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received:', token.substring(0, 20) + '...'); // Debug log

    const supabase = connectSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    console.log('Auth result:', { userId: user?.id, error }); // Debug log

    if (error || !user) {
      console.error('Auth error:', error);
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