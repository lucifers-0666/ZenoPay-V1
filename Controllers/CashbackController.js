const CashbackTransaction = require("../Models/CashbackTransaction");

exports.getCashbackPage = async (req, res) => {
  try {
    const userId = req.session?.user?._id;
    const isGuestPreview = process.env.NODE_ENV !== 'production' && !userId;
    if (!userId && !isGuestPreview) {
      return res.redirect("/login");
    }

    const rows = userId
      ? await CashbackTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .populate("transactionId")
        .lean()
      : [];

    const totalLifetimeCashback = rows
      .filter((r) => r.status === "credited")
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);

    return res.render("cashback-history", {
      pageTitle: "Cashback History - ZenoPay",
      isLoggedIn: !!userId,
      user: req.session.user || { FullName: "Guest Preview", ZenoPayID: "ZP-PREVIEW" },
      previewMode: isGuestPreview,
      cashbackRows: rows,
      totalLifetimeCashback,
    });
  } catch (error) {
    console.error("[Cashback] getCashbackPage failed:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};
