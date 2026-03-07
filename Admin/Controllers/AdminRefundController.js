const Refund = require("../../Models/Refund");
const { sanitizeDateRange } = require("../../utils/dateUtils");

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

exports.refundsList = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const { dateFrom, dateTo, fromDate, toDateEnd } = sanitizeDateRange(
      req.query.dateFrom,
      req.query.dateTo
    );

    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = [10, 25, 50].includes(parseInt(limit, 10)) ? parseInt(limit, 10) : 10;
    const skip = (safePage - 1) * safeLimit;

    const query = {};

    if (status && status !== "all") query.status = status;

    if (search) {
      query.$or = [
        { refundId: { $regex: search, $options: "i" } },
        { reason: { $regex: search, $options: "i" } },
        { transactionRef: { $regex: search, $options: "i" } },
      ];
    }

    if (fromDate || toDateEnd) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = fromDate;
      if (toDateEnd) query.createdAt.$lte = toDateEnd;
    }

    const [refunds, totalCount, pendingCount, approvedCount, rejectedCount, totalAmount] = await Promise.all([
      Refund.find(query)
        .populate("userId", "name email")
        .populate("transactionId", "TransactionID Description")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Refund.countDocuments(query),
      Refund.countDocuments({ status: "pending" }),
      Refund.countDocuments({ status: "approved" }),
      Refund.countDocuments({ status: "rejected" }),
      Refund.aggregate([
        { $match: { status: "pending" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const shaped = refunds.map((r) => {
      const transactionNumeric = r.transactionId && r.transactionId.TransactionID
        ? String(r.transactionId.TransactionID)
        : "";
      return {
        ...r,
        displayRefundId: r.refundId || String(r._id),
        displayTxnId: transactionNumeric || r.transactionRef || "—",
        userName: r.userId?.name || "Unknown User",
        userEmail: r.userId?.email || "—",
        amount: toNumber(r.amount),
      };
    });

    res.locals.adminPage = "refunds";
    return res.render("admin/refunds/admin-refunds", {
      page: "refunds",
      currentPage: "refunds",
      adminPage: "refunds",
      pageTitle: "Refunds Management",
      refunds: shaped,
      totalCount,
      pendingCount,
      approvedCount,
      rejectedCount,
      totalPendingAmount: totalAmount[0] ? toNumber(totalAmount[0].total) : 0,
      currentPageNumber: safePage,
      perPage: safeLimit,
      totalPages: Math.max(1, Math.ceil(totalCount / safeLimit)),
      filters: {
        search: search || "",
        status: status || "all",
        dateFrom: dateFrom || "",
        dateTo: dateTo || "",
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
};

exports.refundDetails = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id)
      .populate("userId", "name email")
      .populate("transactionId", "TransactionID Description")
      .lean();

    if (!refund) {
      return res.status(404).send("Refund not found");
    }

    res.locals.adminPage = "refunds";
    return res.render("admin/refunds/admin-refund-details", {
      page: "refunds",
      currentPage: "refunds",
      adminPage: "refunds",
      pageTitle: "Refund Details",
      refund,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server Error");
  }
};

exports.approveRefund = async (req, res) => {
  try {
    const refund = await Refund.findByIdAndUpdate(
      req.params.id,
      {
        status: "approved",
        approvedAt: new Date(),
        processedAt: new Date(),
        approvedBy: req.user?._id || req.session?.user?._id || null,
        adminNote: req.body?.note || "",
      },
      { new: true }
    );

    if (!refund) return res.status(404).json({ success: false, message: "Refund not found" });

    return res.json({ success: true, message: "Refund approved successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.rejectRefund = async (req, res) => {
  try {
    const refund = await Refund.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        rejectedAt: new Date(),
        processedAt: new Date(),
        rejectionReason: req.body?.reason || "Other",
        adminNote: req.body?.notes || "",
      },
      { new: true }
    );

    if (!refund) return res.status(404).json({ success: false, message: "Refund not found" });

    return res.json({ success: true, message: "Refund rejected" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.bulkRefundAction = async (req, res) => {
  try {
    const { refundIds, action } = req.body;

    if (!refundIds || !Array.isArray(refundIds) || refundIds.length === 0) {
      return res.status(400).json({ success: false, message: "No refunds selected" });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    const update = {
      status: newStatus,
      updatedAt: new Date(),
      processedAt: new Date(),
    };

    if (newStatus === "approved") {
      update.approvedAt = new Date();
      update.approvedBy = req.user?._id || req.session?.user?._id || null;
    }

    if (newStatus === "rejected") {
      update.rejectedAt = new Date();
    }

    await Refund.updateMany({ _id: { $in: refundIds } }, { $set: update });

    return res.json({
      success: true,
      message: `${refundIds.length} refund(s) ${newStatus} successfully`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.exportRefunds = async (req, res) => {
  try {
    const { ids, status } = req.query;
    const query = {};

    if (ids) {
      query._id = { $in: String(ids).split(",") };
    } else if (status) {
      query.status = status;
    }

    const refunds = await Refund.find(query)
      .populate("userId", "name email")
      .populate("transactionId", "TransactionID")
      .lean();

    const headers = ["Refund ID", "User", "Email", "Amount", "Status", "Reason", "Date"];

    const rows = refunds.map((r) => {
      const refundId = r.refundId || r._id;
      const userName = r.userId?.name || "";
      const userEmail = r.userId?.email || "";
      const amount = toNumber(r.amount);
      const rowStatus = r.status || "";
      const reason = r.reason || "";
      const date = r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "";
      return [refundId, userName, userEmail, amount, rowStatus, reason, date];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="refunds-export.csv"');
    return res.send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
