import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'healix-dev-secret-change-me';

export const signAuthToken = (user) => {
  return jwt.sign(
    {
      id: String(user._id),
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

export const requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Missing authentication token' });
    }

    const token = header.slice(7).trim();
    if (!token) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: String(decoded.id),
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};
