const mongoose = require("mongoose");
const Wallet = require("../Models/Wallet");
const Transaction = require("../Models/Transaction");
const ZenoPayUser = require("../Models/ZenoPayUser");
const { verifyTransactionPinForUser } = require("../utils/transactionPin");

const PAGE_SIZE = 10;

const setFlash = (req, payload) => {
  req.session.walletFlash = payload;
};

const getFlash = (req) => {
  const flash = req.session.walletFlash || null;
  delete req.session.walletFlash;
  return flash;
};

const toAmount = (value) => {
  const parsed = Number(String(value ?? "").replace(/[,₹\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : NaN;
};

const generateReference = (suffix = "") => {
  const random4 = Math.floor(1000 + Math.random() * 9000);
  return `ZP${Date.now()}${random4}${suffix}`;
};

const getSessionIdentity = (req) => ({
  id: req.user?._id || req.session?.user?._id || null,
  zenoPayId:
    req.session?.user?.ZenoPayID ||
    req.session?.user?.ZenoPayId ||
    req.session?.user?.userId ||
    null,
  email: req.session?.user?.Email || req.session?.user?.email || null,
});

const resolveCurrentUser = async (req) => {
  const identity = getSessionIdentity(req);

  if (identity.id && mongoose.Types.ObjectId.isValid(identity.id)) {
    return ZenoPayUser.findById(identity.id);
  }

  const or = [];
  if (identity.zenoPayId) {
    or.push({ ZenoPayID: identity.zenoPayId }, { userId: identity.zenoPayId });
  }
  if (identity.email) {
    or.push({ Email: identity.email }, { email: String(identity.email).toLowerCase() });
  }

  if (!or.length) return null;
  return ZenoPayUser.findOne({ $or: or });
};

const ensureWallet = async (userId, session = null) => {
  return Wallet.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        userId,
        balance: 0,
        currency: "INR",
        isActive: true,
      },
      $set: {
        updatedAt: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      session,
    }
  );
};

const findRecipientByQuery = async (query) => {
  const raw = String(query || "").trim();
  if (!raw) return null;

  if (raw.includes("@")) {
    return ZenoPayUser.findOne({
      $or: [{ Email: raw.toLowerCase() }, { email: raw.toLowerCase() }],
    });
  }

  const phone = raw.replace(/\D/g, "").slice(-10);
  if (!phone) return null;

  return ZenoPayUser.findOne({
    $or: [{ phone }, { Mobile: phone }, { PhoneNumber: phone }],
  });
};

const getUserDisplayName = (user) => user?.name || user?.FullName || user?.Name || "ZenoPay User";

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "ZU";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const baseViewState = (req, user) => ({
  pageTitle: "Wallet - ZenoPay",
  isLoggedIn: !!req.session?.isLoggedIn,
  user: req.session?.user || user,
  flash: getFlash(req),
});

const getBalance = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) return res.redirect("/login");

    const wallet = await ensureWallet(currentUser._id);
    const recentTransactions = await Transaction.find({ userId: currentUser._id })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    return res.render("wallet/balance", {
      ...baseViewState(req, currentUser),
      pageTitle: "Wallet Balance - ZenoPay",
      wallet,
      recentTransactions,
    });
  } catch (error) {
    console.error("[Wallet] getBalance error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const getTopUp = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) return res.redirect("/login");

    const wallet = await ensureWallet(currentUser._id);

    return res.render("wallet/topup", {
      ...baseViewState(req, currentUser),
      pageTitle: "Add Money - ZenoPay",
      wallet,
      errors: {},
      form: {},
    });
  } catch (error) {
    console.error("[Wallet] getTopUp error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const processTopUp = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) return res.redirect("/login");

    const amount = toAmount(req.body?.amount);
    const errors = {};

    if (!Number.isFinite(amount)) {
      errors.amount = "Please enter a valid amount.";
    } else if (amount < 10 || amount > 100000) {
      errors.amount = "Amount must be between ₹10 and ₹100,000.";
    }

    if (Object.keys(errors).length > 0) {
      const wallet = await ensureWallet(currentUser._id);
      return res.status(400).render("wallet/topup", {
        ...baseViewState(req, currentUser),
        pageTitle: "Add Money - ZenoPay",
        wallet,
        errors,
        form: { amount: req.body?.amount },
      });
    }

    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await ensureWallet(currentUser._id, session);

        await Wallet.updateOne(
          { userId: currentUser._id, isActive: true },
          { $inc: { balance: amount }, $set: { updatedAt: new Date() } },
          { session }
        );

        await Transaction.create(
          [
            {
              userId: currentUser._id,
              type: "topup",
              amount,
              status: "completed",
              reference: generateReference(),
              description: "Wallet top-up",
              metadata: { source: "simulated_gateway" },
            },
          ],
          { session }
        );
      });
    } finally {
      session.endSession();
    }

    setFlash(req, {
      type: "success",
      message: `₹${amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} added to your wallet successfully.`,
    });

    return res.redirect("/wallet/transactions");
  } catch (error) {
    console.error("[Wallet] processTopUp error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const searchUser = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) {
      return res.status(401).json({ found: false });
    }

    const q = String(req.query?.q || "").trim();
    if (!q) {
      return res.json({ found: false });
    }

    const recipient = await findRecipientByQuery(q);

    if (!recipient || String(recipient._id) === String(currentUser._id)) {
      return res.json({ found: false });
    }

    const name = getUserDisplayName(recipient);
    return res.json({
      found: true,
      name,
      initials: getInitials(name),
    });
  } catch (error) {
    console.error("[Wallet] searchUser error:", error);
    return res.status(500).json({ found: false });
  }
};

const getSend = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) return res.redirect("/login");

    const wallet = await ensureWallet(currentUser._id);

    return res.render("wallet/send", {
      ...baseViewState(req, currentUser),
      pageTitle: "Send Money - ZenoPay",
      wallet,
      errors: {},
      form: {},
      recipientPreview: null,
      successData: null,
    });
  } catch (error) {
    console.error("[Wallet] getSend error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const processSend = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) return res.redirect("/login");

    const recipientQuery = String(req.body?.recipient || "").trim();
    const amount = toAmount(req.body?.amount);
    const pin = String(req.body?.pin || "").trim();
    const wallet = await ensureWallet(currentUser._id);

    const errors = {};

    if (!recipientQuery) {
      errors.recipient = "Recipient phone or email is required.";
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      errors.amount = "Please enter a valid amount.";
    }

    if (!/^\d{6}$/.test(pin)) {
      errors.pin = "Please enter your 6-digit transaction PIN.";
    }

    let recipient = null;

    if (!errors.recipient) {
      recipient = await findRecipientByQuery(recipientQuery);
      if (!recipient) {
        errors.recipient = "No ZenoPay user found with this phone/email";
      } else if (String(recipient._id) === String(currentUser._id)) {
        errors.recipient = "You cannot send money to yourself";
      }
    }

    if (!errors.pin) {
      const pinResult = await verifyTransactionPinForUser(currentUser, pin);
      if (!pinResult.valid) {
        errors.pin =
          pinResult.message ||
          `Invalid transaction PIN.${typeof pinResult.attemptsLeft === "number" ? ` Attempts left: ${pinResult.attemptsLeft}` : ""}`;
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).render("wallet/send", {
        ...baseViewState(req, currentUser),
        pageTitle: "Send Money - ZenoPay",
        wallet,
        errors,
        form: {
          recipient: recipientQuery,
          amount: req.body?.amount,
        },
        recipientPreview: recipient
          ? {
              name: getUserDisplayName(recipient),
              initials: getInitials(getUserDisplayName(recipient)),
            }
          : null,
        successData: null,
      });
    }

    const session = await mongoose.startSession();
    let senderTxReference = "";

    try {
      await session.withTransaction(async () => {
        await ensureWallet(currentUser._id, session);
        await ensureWallet(recipient._id, session);

        const senderWallet = await Wallet.findOneAndUpdate(
          {
            userId: currentUser._id,
            isActive: true,
            balance: { $gte: amount },
          },
          {
            $inc: { balance: -amount },
            $set: { updatedAt: new Date() },
          },
          {
            new: true,
            session,
          }
        );

        if (!senderWallet) {
          throw new Error("INSUFFICIENT_BALANCE");
        }

        await Wallet.updateOne(
          { userId: recipient._id, isActive: true },
          {
            $inc: { balance: amount },
            $set: { updatedAt: new Date() },
          },
          { session }
        );

        const baseRef = generateReference();
        senderTxReference = `${baseRef}S`;
        const receiverTxReference = `${baseRef}R`;

        await Transaction.create(
          [
            {
              userId: currentUser._id,
              type: "send",
              amount,
              status: "completed",
              reference: senderTxReference,
              description: `Sent to ${getUserDisplayName(recipient)}`,
              metadata: {
                recipientId: recipient._id,
                recipientName: getUserDisplayName(recipient),
              },
            },
            {
              userId: recipient._id,
              type: "receive",
              amount,
              status: "completed",
              reference: receiverTxReference,
              description: `Received from ${getUserDisplayName(currentUser)}`,
              metadata: {
                senderId: currentUser._id,
                senderName: getUserDisplayName(currentUser),
              },
            },
          ],
          { session }
        );
      });
    } catch (txError) {
      if (txError?.message === "INSUFFICIENT_BALANCE") {
        return res.status(400).render("wallet/send", {
          ...baseViewState(req, currentUser),
          pageTitle: "Send Money - ZenoPay",
          wallet,
          errors: { amount: "Insufficient balance" },
          form: {
            recipient: recipientQuery,
            amount: req.body?.amount,
          },
          recipientPreview: {
            name: getUserDisplayName(recipient),
            initials: getInitials(getUserDisplayName(recipient)),
          },
          successData: null,
        });
      }
      throw txError;
    } finally {
      session.endSession();
    }

    const refreshedWallet = await ensureWallet(currentUser._id);

    return res.render("wallet/send", {
      ...baseViewState(req, currentUser),
      pageTitle: "Send Money - ZenoPay",
      wallet: refreshedWallet,
      errors: {},
      form: {},
      recipientPreview: null,
      successData: {
        recipientName: getUserDisplayName(recipient),
        amount,
        reference: senderTxReference,
      },
      flash: {
        type: "success",
        message: `Sent ₹${amount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} to ${getUserDisplayName(recipient)} successfully.`,
      },
    });
  } catch (error) {
    console.error("[Wallet] processSend error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

const getTransactions = async (req, res) => {
  try {
    const currentUser = await resolveCurrentUser(req);
    if (!currentUser) return res.redirect("/login");

    const filter = String(req.query?.type || "all").toLowerCase();
    const page = Math.max(1, Number.parseInt(req.query?.page || "1", 10));

    const query = { userId: currentUser._id };
    if (["topup", "send", "receive"].includes(filter)) {
      query.type = filter;
    }

    const [totalCount, txRows, totalsAgg, wallet] = await Promise.all([
      Transaction.countDocuments(query),
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
      Transaction.aggregate([
        {
          $match: {
            userId: currentUser._id,
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalIn: {
              $sum: {
                $cond: [{ $in: ["$type", ["topup", "receive", "refund"]] }, "$amount", 0],
              },
            },
            totalOut: {
              $sum: {
                $cond: [{ $eq: ["$type", "send"] }, "$amount", 0],
              },
            },
          },
        },
      ]),
      ensureWallet(currentUser._id),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

    let running = Number(wallet?.balance || 0);
    const transactions = txRows.map((tx) => {
      const mapped = {
        ...tx,
        runningBalance: running,
      };

      if (["topup", "receive", "refund"].includes(tx.type)) {
        running -= Number(tx.amount || 0);
      } else if (tx.type === "send") {
        running += Number(tx.amount || 0);
      }

      return mapped;
    });

    return res.render("wallet/transactions", {
      ...baseViewState(req, currentUser),
      pageTitle: "Wallet Transactions - ZenoPay",
      transactions,
      currentPage: page,
      totalPages,
      filter,
      totalIn: Number(totalsAgg?.[0]?.totalIn || 0),
      totalOut: Number(totalsAgg?.[0]?.totalOut || 0),
    });
  } catch (error) {
    console.error("[Wallet] getTransactions error:", error);
    return res.status(500).render("error-500", {
      pageTitle: "Server Error - ZenoPay",
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`,
    });
  }
};

// Legacy aliases to avoid breaking existing route handlers while migrating
const getAddMoneyPage = getTopUp;
const addMoney = processTopUp;
const getWithdrawPage = getSend;
const withdrawMoney = processSend;

module.exports = {
  getBalance,
  getTopUp,
  processTopUp,
  getSend,
  processSend,
  searchUser,
  getTransactions,
  getAddMoneyPage,
  addMoney,
  getWithdrawPage,
  withdrawMoney,
};
