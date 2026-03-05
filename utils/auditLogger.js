const AuditLog = require("../Models/AuditLog");
const ZenoPayUser = require("../Models/ZenoPayUser");

const resolveAdminId = async (req) => {
  if (req?.user?._id) return req.user._id;

  const zenoPayId = req?.session?.user?.ZenoPayID;
  if (!zenoPayId) return null;

  const admin = await ZenoPayUser.findOne({ ZenoPayID: zenoPayId, Role: "admin" })
    .select("_id")
    .lean();

  return admin?._id || null;
};

const logAction = async (req, action, description, options = {}) => {
  try {
    const adminId = await resolveAdminId(req);
    await AuditLog.create({
      adminId,
      action,
      category: options.category || "system",
      description,
      targetId: options.targetId,
      targetType: options.targetType,
      ipAddress: req?.ip || req?.headers?.["x-forwarded-for"] || "",
      userAgent: req?.headers?.["user-agent"] || "",
      status: options.status || "success",
      metadata: options.metadata,
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
};

module.exports = { logAction };
