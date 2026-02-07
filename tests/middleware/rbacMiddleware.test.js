/**
 * RBAC Middleware Tests
 */

const {
  requireRole,
  requirePermission,
  isAuthenticated,
  isAdmin,
  isMerchant,
  hasPermission,
} = require("../../Admin/Middleware/rbacMiddleware");

describe("RBAC Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      session: {
        user: {
          _id: "test123",
          Role: "admin",
          FullName: "Test Admin",
        },
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  describe("isAuthenticated", () => {
    it("should allow authenticated users", () => {
      isAuthenticated(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject unauthenticated users", () => {
      req.session = {};

      isAuthenticated(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe("isAdmin", () => {
    it("should allow admin users", () => {
      req.session.user.Role = "admin";

      isAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should reject non-admin users", () => {
      req.session.user.Role = "user";

      isAdmin(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("isMerchant", () => {
    it("should allow merchant users", () => {
      req.session.user.Role = "merchant";

      isMerchant(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should reject non-merchant users", () => {
      req.session.user.Role = "user";

      isMerchant(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("requireRole", () => {
    it("should allow matching single role", () => {
      const middleware = requireRole("admin");
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should allow matching role from array", () => {
      const middleware = requireRole(["admin", "merchant"]);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should reject non-matching role", () => {
      req.session.user.Role = "user";
      const middleware = requireRole("admin");
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("requirePermission", () => {
    it("should allow user with correct permission", () => {
      req.session.user.Role = "admin";
      const middleware = requirePermission("users", "view");
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should reject user without permission", () => {
      req.session.user.Role = "user";
      const middleware = requirePermission("users", "delete");
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("hasPermission", () => {
    it("should return true for valid permission", () => {
      const result = hasPermission("admin", "users", "delete");

      expect(result).toBe(true);
    });

    it("should return false for invalid permission", () => {
      const result = hasPermission("user", "merchants", "approve");

      expect(result).toBe(false);
    });

    it("should return false for non-existent role", () => {
      const result = hasPermission("invalid", "users", "view");

      expect(result).toBe(false);
    });
  });
});
