//C:\Users\tiffa\OneDrive\Desktop\Live\middleware\auth.js
// middleware/auth.js
// C:\Users\tiffa\OneDrive\Desktop\Live\middleware\auth.js
function ensureAuthenticated(req, res, next) {
  if (req.session?.userId) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

function ensureRole(role) {
  return (req, res, next) => {
    const roles = req.session?.roles || [];
    if (roles.includes(role)) return next();
    return res.status(403).json({ error: 'Forbidden' });
  };
}

// middleware/requireAuth.js
module.exports = function requireAuth(req, res, next) {
  // adapt to how you set sessions; you showed: req.session.userId
  const uid = req.session?.userId;
  if (!uid) return res.status(401).json({ error: 'Not logged in' });
  req.user = { id: String(uid), role: 'user' }; // add role if you have it
  next();
};

module.exports = { ensureAuthenticated, ensureRole };
