/**
 * Pricing Controller
 * Handles rendering of the pricing page
 */

const Plan = require("../Models/Plan");
const PricingSettings = require("../Models/PricingSettings");

const toDisplayPlan = (plan, settings) => {
  const monthlyPrice = Number(plan.monthlyPrice || 0);
  const annualPrice = Number(plan.annualPrice || 0);
  const discount = Number(plan.discount || settings.annualDiscount || 0);
  const yearlyEquivalent = annualPrice > 0 ? annualPrice / 12 : 0;

  return {
    id: String(plan._id),
    slug: plan.slug,
    name: plan.name,
    tagline: plan.tagline || "",
    description: plan.description || "",
    status: plan.status,
    monthlyPrice,
    annualPrice,
    yearlyMonthlyEquivalent: yearlyEquivalent,
    discount,
    features: Array.isArray(plan.features) ? plan.features : [],
    transactionFeeText: plan.transactionFeeText || "Custom pricing available",
    volumeLimitText: plan.volumeLimitText || "Flexible volume limits",
    monthlyTxLimit: Number(plan.monthlyTxLimit || 0),
    showOnPricingPage: plan.showOnPricingPage !== false,
    highlightPopular: !!plan.highlightPopular,
    bestValue: !!plan.bestValue,
    isCustomPricing: monthlyPrice <= 0 || annualPrice <= 0,
  };
};

/**
 * Get Pricing Page
 * Renders the comprehensive pricing page with all plans
 */
const getPricingPage = async (req, res) => {
  try {
    const [settingsDoc, plansFromDb] = await Promise.all([
      PricingSettings.getSettings(),
      Plan.getPublicPlans(),
    ]);

    const plans = plansFromDb.map((plan) => toDisplayPlan(plan, settingsDoc));

    res.render('pricing', {
      pageTitle: 'Pricing - ZenoPay | Transparent Payment Gateway Pricing',
      isLoggedIn: req.session?.isLoggedIn || false,
      user: req.session?.user || null,
      pricingData: {
        plans,
        settings: {
          applyGST: !!settingsDoc.applyGST,
          gstRate: Number(settingsDoc.gstRate || 0),
          annualDiscount: Number(settingsDoc.annualDiscount || 0),
          studentDiscountEnabled: !!settingsDoc.studentDiscountEnabled,
          studentDiscount: Number(settingsDoc.studentDiscount || 0),
        },
        lastUpdated: settingsDoc.updatedAt || new Date(),
      }
    });
  } catch (error) {
    console.error('Error rendering pricing page:', error);
    res.status(500).render('error-500', {
      pageTitle: 'Error - ZenoPay',
      error: 'Failed to load Pricing page',
      isLoggedIn: req.session?.isLoggedIn || false,
      user: req.session?.user || null
    });
  }
};

/**
 * Calculate Custom Quote (API endpoint)
 * For enterprise customers requesting custom pricing
 */
const calculateCustomQuote = (req, res) => {
  try {
    const { monthlyVolume, transactionCount, businessType } = req.body;
    
    // Validation
    if (!monthlyVolume || !transactionCount) {
      return res.status(400).json({
        success: false,
        message: 'Monthly volume and transaction count are required'
      });
    }
    
    // Simple calculation logic (can be made more sophisticated)
    let recommendedPlan = 'starter';
    let estimatedFee = 0;
    
    const volume = parseFloat(monthlyVolume);
    
    if (volume <= 500000) {
      recommendedPlan = 'starter';
      estimatedFee = volume * 0.025;
    } else if (volume <= 2500000) {
      recommendedPlan = 'professional';
      estimatedFee = volume * 0.020;
    } else if (volume <= 10000000) {
      recommendedPlan = 'business';
      estimatedFee = volume * 0.0175;
    } else {
      recommendedPlan = 'enterprise';
      estimatedFee = volume * 0.012;
    }
    
    res.json({
      success: true,
      data: {
        recommendedPlan,
        estimatedMonthlyFees: estimatedFee,
        potentialSavings: calculateSavings(volume),
        volumeTier: getVolumeTier(volume)
      }
    });
  } catch (error) {
    console.error('Error calculating custom quote:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate quote'
    });
  }
};

/**
 * Helper function to calculate potential savings with GST
 */
function calculateSavings(volume) {
  const baseRate = 0.025; // Starter rate
  const gstDiscountRate = 0.023; // With GST discount
  
  const withoutGST = volume * baseRate;
  const withGST = volume * gstDiscountRate;
  
  return withoutGST - withGST;
}

/**
 * Helper function to determine volume tier
 */
function getVolumeTier(volume) {
  if (volume <= 500000) return 'low';
  if (volume <= 2500000) return 'medium';
  if (volume <= 10000000) return 'high';
  return 'enterprise';
}

/**
 * Compare Plans (Optional endpoint for dynamic comparison)
 */
const comparePlans = async (req, res) => {
  try {
    const plans = await Plan.getPublicPlans();
    const data = plans.reduce((acc, plan) => {
      acc[plan.slug || String(plan._id)] = {
        id: String(plan._id),
        name: plan.name,
        price: {
          monthly: Number(plan.monthlyPrice || 0),
          yearly: Number(plan.annualPrice || 0),
        },
        discount: Number(plan.discount || 0),
        monthlyTxLimit: Number(plan.monthlyTxLimit || 0),
        transactionFees: {
          domestic: plan.transactionFeeText || "Custom",
        },
        features: Array.isArray(plan.features) ? plan.features : [],
        status: plan.status,
      };
      return acc;
    }, {});

    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error comparing plans:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve plan comparison'
    });
  }
};

const getPricingData = async (req, res) => {
  try {
    const [settingsDoc, plansFromDb] = await Promise.all([
      PricingSettings.getSettings(),
      Plan.getPublicPlans(),
    ]);

    const plans = plansFromDb.map((plan) => toDisplayPlan(plan, settingsDoc));

    return res.json({
      success: true,
      data: {
        plans,
        settings: {
          applyGST: !!settingsDoc.applyGST,
          gstRate: Number(settingsDoc.gstRate || 0),
          annualDiscount: Number(settingsDoc.annualDiscount || 0),
          studentDiscountEnabled: !!settingsDoc.studentDiscountEnabled,
          studentDiscount: Number(settingsDoc.studentDiscount || 0),
        },
        lastUpdated: settingsDoc.updatedAt || new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching pricing data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing data',
    });
  }
};

module.exports = {
  getPricingPage,
  calculateCustomQuote,
  comparePlans,
  getPricingData,
};
