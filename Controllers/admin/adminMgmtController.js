const bcrypt = require("bcryptjs");
const ZenoPayUser = require("../../Models/ZenoPayUser");

const normalizeStatus = (status = "") => {
  const key = String(status).trim().toLowerCase();
  if (key === "active") return "Active";
  if (key === "inactive") return "Inactive";
  if (key === "suspended") return "Suspended";
  return "Active";
};

const makeJsonAwareResponse = (req, res, payload, redirectUrl) => {
  const acceptsJson = req.xhr || req.headers.accept?.includes("application/json") || req.query.api === "true";
  if (acceptsJson) {
    return res.json(payload);
  }
  return res.redirect(redirectUrl);
};

const generateAdminZenoPayId = async () => {
  let unique = false;
  let generated = "";

  while (!unique) {
    const suffix = Math.floor(100000 + Math.random() * 900000);
    generated = `ZP-ADM${suffix}`;
    const existing = await ZenoPayUser.findOne({ ZenoPayID: generated }).lean();
    unique = !existing;
  }

  return generated;
};

const getAdminManagementPage = async (req, res) => {
  try {
    const admins = await ZenoPayUser.find({ Role: "admin" })
      .sort({ RegistrationDate: -1, createdAt: -1 })
      .select("ZenoPayID FullName Email Mobile Role AccountStatus RegistrationDate LastLoginAt ImagePath")
      .lean();

    const totalAdmins = admins.length;
    const activeAdmins = admins.filter((admin) => normalizeStatus(admin.AccountStatus) === "Active").length;
    const inactiveAdmins = admins.filter((admin) => normalizeStatus(admin.AccountStatus) === "Inactive").length;
    const suspendedAdmins = admins.filter((admin) => normalizeStatus(admin.AccountStatus) === "Suspended").length;

    return res.render("admin/admins/admin-management", {
      title: "Admin Management",
      page: "admins",
      adminPage: "admins",
      admins,
      stats: {
        totalAdmins,
        activeAdmins,
        inactiveAdmins,
        suspendedAdmins,
      },
      success: req.query.success || null,
      error: req.query.error || null,
      breadcrumb: [{ name: "Admin Management", url: "/admin/admins" }],
    });
  } catch (error) {
    console.error("Admin management page error:", error);
    return res.status(500).render("admin/admins/admin-management", {
      title: "Admin Management",
      page: "admins",
      adminPage: "admins",
      admins: [],
      stats: {
        totalAdmins: 0,
        activeAdmins: 0,
        inactiveAdmins: 0,
        suspendedAdmins: 0,
      },
      success: null,
      error: "Unable to load admin records right now.",
      breadcrumb: [{ name: "Admin Management", url: "/admin/admins" }],
    });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { fullName, email, password, mobile } = req.body;

    if (!fullName || !email || !password) {
      return makeJsonAwareResponse(
        req,
        res,
        { success: false, message: "Full name, email, and password are required." },
        "/admin/admins?error=Full%20name%2C%20email%2C%20and%20password%20are%20required."
      );
    }

    if (String(password).length < 8) {
      return makeJsonAwareResponse(
        req,
        res,
        { success: false, message: "Password must be at least 8 characters." },
        "/admin/admins?error=Password%20must%20be%20at%20least%208%20characters."
      );
    }

    const existingEmail = await ZenoPayUser.findOne({ Email: String(email).trim().toLowerCase() }).lean();
    if (existingEmail) {
      return makeJsonAwareResponse(
        req,
        res,
        { success: false, message: "Email already exists." },
        "/admin/admins?error=Email%20already%20exists."
      );
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const generatedId = await generateAdminZenoPayId();

    const safeMobile = String(mobile || "9999999999").replace(/\D/g, "").slice(-10) || "9999999999";

    await ZenoPayUser.create({
      ZenoPayID: generatedId,
      Password: hashedPassword,
      FullName: String(fullName).trim(),
      DOB: new Date("1990-01-01"),
      Gender: "Not Specified",
      Mobile: safeMobile.padStart(10, "9"),
      Email: String(email).trim().toLowerCase(),
      FatherName: "System",
      MotherName: "",
      Address: "Admin Office",
      City: "N/A",
      State: "N/A",
      Pincode: "000000",
      role: "Admin",
      Role: "admin",
      AccountStatus: "Active",
      EmailVerified: true,
    });

    return makeJsonAwareResponse(
      req,
      res,
      { success: true, message: "Admin created successfully." },
      "/admin/admins?success=Admin%20created%20successfully."
    );
  } catch (error) {
    console.error("Create admin error:", error);
    return makeJsonAwareResponse(
      req,
      res,
      { success: false, message: "Failed to create admin." },
      "/admin/admins?error=Failed%20to%20create%20admin."
    );
  }
};

const updateAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const nextStatus = normalizeStatus(status);

    const admin = await ZenoPayUser.findById(id);
    if (!admin || admin.Role !== "admin") {
      return makeJsonAwareResponse(
        req,
        res,
        { success: false, message: "Admin not found." },
        "/admin/admins?error=Admin%20not%20found."
      );
    }

    if (req.session?.user?.ZenoPayID && req.session.user.ZenoPayID === admin.ZenoPayID && nextStatus !== "Active") {
      return makeJsonAwareResponse(
        req,
        res,
        { success: false, message: "You cannot deactivate your own admin account." },
        "/admin/admins?error=You%20cannot%20deactivate%20your%20own%20admin%20account."
      );
    }

    admin.AccountStatus = nextStatus;
    await admin.save();

    return makeJsonAwareResponse(
      req,
      res,
      { success: true, message: "Admin status updated successfully." },
      "/admin/admins?success=Admin%20status%20updated%20successfully."
    );
  } catch (error) {
    console.error("Update admin status error:", error);
    return makeJsonAwareResponse(
      req,
      res,
      { success: false, message: "Failed to update admin status." },
      "/admin/admins?error=Failed%20to%20update%20admin%20status."
    );
  }
};

const updateAdminRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const normalizedRole = String(role || "admin").trim().toLowerCase();

    if (!["admin", "super-admin", "super_admin"].includes(normalizedRole)) {
      return makeJsonAwareResponse(
        req,
        res,
        { success: false, message: "Unsupported role value." },
        "/admin/admins?error=Unsupported%20role%20value."
      );
    }

    const admin = await ZenoPayUser.findById(id);
    if (!admin) {
      return makeJsonAwareResponse(
        req,
        res,
        { success: false, message: "Admin not found." },
        "/admin/admins?error=Admin%20not%20found."
      );
    }

    admin.role = "Admin";
    admin.Role = "admin";
    await admin.save();

    return makeJsonAwareResponse(
      req,
      res,
      { success: true, message: "Admin role updated successfully." },
      "/admin/admins?success=Admin%20role%20updated%20successfully."
    );
  } catch (error) {
    console.error("Update admin role error:", error);
    return makeJsonAwareResponse(
      req,
      res,
      { success: false, message: "Failed to update admin role." },
      "/admin/admins?error=Failed%20to%20update%20admin%20role."
    );
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await ZenoPayUser.findById(id);

    if (!admin || admin.Role !== "admin") {
      return makeJsonAwareResponse(
        req,
        res,
        { success: false, message: "Admin not found." },
        "/admin/admins?error=Admin%20not%20found."
      );
    }

    if (req.session?.user?.ZenoPayID && req.session.user.ZenoPayID === admin.ZenoPayID) {
      return makeJsonAwareResponse(
        req,
        res,
        { success: false, message: "You cannot delete your own account." },
        "/admin/admins?error=You%20cannot%20delete%20your%20own%20account."
      );
    }

    const remainingAdmins = await ZenoPayUser.countDocuments({ Role: "admin", _id: { $ne: admin._id } });
    if (remainingAdmins < 1) {
      return makeJsonAwareResponse(
        req,
        res,
        { success: false, message: "At least one admin account must remain." },
        "/admin/admins?error=At%20least%20one%20admin%20account%20must%20remain."
      );
    }

    await ZenoPayUser.findByIdAndDelete(id);

    return makeJsonAwareResponse(
      req,
      res,
      { success: true, message: "Admin deleted successfully." },
      "/admin/admins?success=Admin%20deleted%20successfully."
    );
  } catch (error) {
    console.error("Delete admin error:", error);
    return makeJsonAwareResponse(
      req,
      res,
      { success: false, message: "Failed to delete admin." },
      "/admin/admins?error=Failed%20to%20delete%20admin."
    );
  }
};

module.exports = {
  getAdminManagementPage,
  createAdmin,
  updateAdminStatus,
  updateAdminRole,
  deleteAdmin,
};
