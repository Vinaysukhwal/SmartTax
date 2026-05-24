/**
 * Authentication Middleware
 * 
 * Protects routes that require a logged-in user.
 * 
 * How it works:
 * 1. Checks for a JWT token in the Authorization header
 * 2. Verifies the token using JWT_SECRET
 * 3. Attaches the user's ID to req.user so routes can use it
 * 4. If no token or invalid token → returns 401 Unauthorized
 */

const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    // Get the token from the "Authorization: Bearer <token>" header
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Please login.' });
    }

    // Extract the token (remove "Bearer " prefix)
    const token = authHeader.replace('Bearer ', '');

    // Verify the token and decode the payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user ID to the request object for use in route handlers
    req.user = { id: decoded.userId };

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    // Token is invalid or expired
    res.status(401).json({ message: 'Invalid or expired token. Please login again.' });
  }
};

module.exports = auth;
