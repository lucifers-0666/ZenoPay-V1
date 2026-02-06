/**
 * RBAC (Role-Based Access Control) Middleware
 * Controls permissions based on user roles and specific permission requirements
 */

// Define role-based permissions
const rolePermissions = {
  admin: {
    dashboard: ["view"],
    users: ["view", "create", "update", "delete", "suspend"],
    merchants: ["view", "create", "approve", "reject", "suspend"],
    banks: ["view", "create", "update", "delete"],
    transactions: ["view", "flag", "resolve", "reverse"],
    disputes: ["view", "resolve", "approve", "reject"],
    reports: ["view", "export", "analytics"],
    settings: ["view", "update"],
    payment_gateway: ["view", "update", "test"],
  },
  merchant: {
    dashboard: ["view"],
    transactions: ["view"],
    products: ["view", "create", "update", "delete"],
    orders: ["view"],
    customers: ["view"],
    payouts: ["view"],
    disputes: ["view"],
    settings: ["view", "update"],
    api_keys: ["view", "create", "revoke"],
  },
  user: {
    dashboard: ["view"],
    transactions: ["view", "create"],
    recipients: ["view", "create", "update", "delete"],
    payments: ["view"],
    cards: ["view", "create", "delete"],
    banks: ["view", "create", "delete"],
    settings: ["view", "update"],
  },
};

/**
 * Check if user has required role
 * @param {string|string[]} roles - Required role(s)
 * @returns {Function} Express middleware
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userRole = req.session.user.Role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Access denied",
        message: "You don't have permission to access this resource",
      });
    }

    next();
  };
};

/**
 * Check if user has specific permission
 * @param {string} resource - Resource name
 * @param {string} action - Action to perform (view, create, update, delete, etc.)
 * @returns {Function} Express middleware
 */
const requirePermission = (resource, action) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userRole = req.session.user.Role;
    const permissions = rolePermissions[userRole];

    if (!permissions || !permissions[resource] || !permissions[resource].includes(action)) {
      return res.status(403).json({
        error: "Access denied",
        message: `You don't have permission to ${action} ${resource}`,
      });
    }

    next();
  };
};

/**
 * Check if user is authenticated
 * @returns {Function} Express middleware
 */
const isAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

/**
 * Check if user is admin
 * @returns {Function} Express middleware
 */
const isAdmin = (req, res, next) => {
  if (!req.session || !req.session.user || req.session.user.Role !== "admin") {
    return res.status(403).json({
      error: "Access denied",
      message: "Admin access required",
    });
  }
  next();
};

/**
 * Check if user is merchant
 * @returns {Function} Express middleware
 */
const isMerchant = (req, res, next) => {
  if (!req.session || !req.session.user || req.session.user.Role !== "merchant") {
    return res.status(403).json({
      error: "Access denied",
      message: "Merchant access required",
    });
  }
  next();
};

/**
 * Get user permissions
 * @param {string} role - User role
 * @returns {object} Role permissions
 */
const getPermissions = (role) => {
  return rolePermissions[role] || {};
};

/**
 * Check if action is allowed for resource
 * @param {string} role - User role
 * @param {string} resource - Resource name
 * @param {string} action - Action to check
 * @returns {boolean}
 */
const hasPermission = (role, resource, action) => {
  const permissions = rolePermissions[role];
  return permissions && permissions[resource] && permissions[resource].includes(action);
};

/**
 * Middleware to attach permissions to request
 */
const attachPermissions = (req, res, next) => {
  if (req.session && req.session.user) {
    req.permissions = getPermissions(req.session.user.Role);
    req.hasPermission = (resource, action) => {
      return hasPermission(req.session.user.Role, resource, action);
    };
  }
  next();
};

module.exports = {
  requireRole,
  requirePermission,
  isAuthenticated,
  isAdmin,
  isMerchant,
  getPermissions,
  hasPermission,
  attachPermissions,
  rolePermissions,
};
