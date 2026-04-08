const KYC_ROUTES = Object.freeze({
  STATUS_PAGE: "/kyc",
  STATUS_JSON: "/kyc/status",
  SUBMIT_PAGE: "/kyc/submit",
  SUBMIT_POST: "/kyc/submit",

  // Backward-compatible aliases
  LEGACY_STATUS_PAGE: "/user/kyc",
  LEGACY_SUBMIT_PAGE: "/user/kyc/submit",
  LEGACY_SUBMIT_POST: "/user/kyc/submit",
});

module.exports = {
  KYC_ROUTES,
};
