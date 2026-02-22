const getBeneficiariesPage = async (req, res) => {
  const beneficiaries = [
    {
      id: "BEN001",
      name: "Aarav Mehta",
      initials: "AM",
      bankName: "HDFC Bank",
      accountMasked: "XXXXXX4521",
      transferType: "Bank Transfer",
      upiOrType: "aarav.mehta@hdfcbank",
      typeKey: "bank",
      isFavourite: true,
      transferCount: 14,
      lastTransfer: "Feb 20, 2026",
      addedAt: "Feb 18, 2026",
      avatarUrl: "",
    },
    {
      id: "BEN002",
      name: "Priya Sharma",
      initials: "PS",
      bankName: "ICICI Bank",
      accountMasked: "XXXXXX3189",
      transferType: "UPI",
      upiOrType: "priya.sharma@icici",
      typeKey: "upi",
      isFavourite: true,
      transferCount: 11,
      lastTransfer: "Feb 19, 2026",
      addedAt: "Feb 12, 2026",
      avatarUrl: "",
    },
    {
      id: "BEN003",
      name: "Rahul Verma",
      initials: "RV",
      bankName: "SBI",
      accountMasked: "XXXXXX9012",
      transferType: "Bank Transfer",
      upiOrType: "rahul.verma@sbi",
      typeKey: "bank",
      isFavourite: false,
      transferCount: 6,
      lastTransfer: "Feb 15, 2026",
      addedAt: "Jan 25, 2026",
      avatarUrl: "",
    },
    {
      id: "BEN004",
      name: "Neha Kapoor",
      initials: "NK",
      bankName: "Axis Bank",
      accountMasked: "XXXXXX6677",
      transferType: "UPI",
      upiOrType: "neha.kapoor@axis",
      typeKey: "upi",
      isFavourite: true,
      transferCount: 9,
      lastTransfer: "Feb 13, 2026",
      addedAt: "Jan 15, 2026",
      avatarUrl: "",
    },
    {
      id: "BEN005",
      name: "Karan Malhotra",
      initials: "KM",
      bankName: "Kotak Bank",
      accountMasked: "XXXXXX7741",
      transferType: "Bank Transfer",
      upiOrType: "karan.m@kotak",
      typeKey: "bank",
      isFavourite: false,
      transferCount: 5,
      lastTransfer: "Feb 10, 2026",
      addedAt: "Feb 04, 2026",
      avatarUrl: "",
    },
    {
      id: "BEN006",
      name: "Sneha Iyer",
      initials: "SI",
      bankName: "Federal Bank",
      accountMasked: "XXXXXX5510",
      transferType: "Mobile Number",
      upiOrType: "+91 98765 43210",
      typeKey: "mobile",
      isFavourite: false,
      transferCount: 3,
      lastTransfer: "Feb 08, 2026",
      addedAt: "Feb 02, 2026",
      avatarUrl: "",
    },
  ];

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const parseDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const isCurrentMonth = (dateValue) => {
    const parsed = parseDate(dateValue);
    if (!parsed) return false;
    return parsed.getMonth() === currentMonth && parsed.getFullYear() === currentYear;
  };

  const stats = {
    total: beneficiaries.length,
    favourites: beneficiaries.filter((item) => item.isFavourite).length,
    transfersThisMonth: beneficiaries.reduce((sum, item) => {
      if (typeof item.transfersThisMonth === "number") {
        return sum + item.transfersThisMonth;
      }
      return isCurrentMonth(item.lastTransfer) ? sum + 1 : sum;
    }, 0),
    recentlyAdded: beneficiaries.filter((item) => isCurrentMonth(item.addedAt)).length,
  };

  return res.render("beneficiary-management", {
    pageTitle: "Beneficiaries - ZenoPay",
    currentPage: "beneficiaries",
    user: req.session.user || null,
    qrCode: req.session.qrCode || null,
    isLoggedIn: req.session.isLoggedIn || false,
    hasBeneficiaries: beneficiaries.length > 0,
    beneficiaries,
    stats,
  });
};

module.exports = {
  getBeneficiariesPage,
};
