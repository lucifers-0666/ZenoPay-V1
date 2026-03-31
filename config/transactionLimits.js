/**
 * Transaction Limits Configuration
 * Defines transaction limits based on user KYC tier
 */

const transactionLimits = {
  tier0: {
    name: 'tier0',
    kycTier: 0,
    description: 'Unverified User',
    dailyLimit: 5000,      // Max amount per day (INR)
    weeklyLimit: 10000,    // Max amount per week (INR)
    singleTxLimit: 2000,   // Max amount per single transaction (INR)
  },
  tier1: {
    name: 'tier1',
    kycTier: 1,
    description: 'KYC Verified',
    dailyLimit: 50000,     // Max amount per day (INR)
    weeklyLimit: 200000,   // Max amount per week (INR)
    singleTxLimit: 25000,  // Max amount per single transaction (INR)
  },
  tier2: {
    name: 'tier2',
    kycTier: 2,
    description: 'Full KYC Enhanced',
    dailyLimit: 200000,    // Max amount per day (INR)
    weeklyLimit: 1000000,  // Max amount per week (INR)
    singleTxLimit: 100000, // Max amount per single transaction (INR)
  },
};

/**
 * Get limits for a specific KYC tier
 * @param {number} kycTier - The KYC tier (0, 1, or 2)
 * @returns {Object} Limits object for the tier
 */
const getLimitsByTier = (kycTier) => {
  const tierKey = `tier${kycTier}`;
  return transactionLimits[tierKey] || transactionLimits.tier0;
};

/**
 * Get all tiers info for display
 * @returns {Array} Array of all tier configurations
 */
const getAllTiers = () => {
  return [
    transactionLimits.tier0,
    transactionLimits.tier1,
    transactionLimits.tier2,
  ];
};

/**
 * Format currency amount
 * @param {number} amount - Amount in INR
 * @returns {string} Formatted string with currency
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

module.exports = {
  transactionLimits,
  getLimitsByTier,
  getAllTiers,
  formatCurrency,
};
