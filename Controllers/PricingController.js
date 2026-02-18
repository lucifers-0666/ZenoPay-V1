/**
 * Pricing Controller
 * Handles rendering of the pricing page
 */

/**
 * Get Pricing Page
 * Renders the comprehensive pricing page with all plans
 */
const getPricingPage = (req, res) => {
  try {
    res.render('pricing', {
      pageTitle: 'Pricing - ZenoPay | Transparent Payment Gateway Pricing',
      isLoggedIn: req.session?.isLoggedIn || false,
      user: req.session?.user || null,
      // Optional: Add pricing metadata for SEO or dynamic content
      pricingData: {
        plans: [
          {
            name: 'Starter',
            monthlyPrice: 299,
            yearlyPrice: 2999,
            targetAudience: 'Individuals & Freelancers'
          },
          {
            name: 'Professional',
            monthlyPrice: 999,
            yearlyPrice: 9999,
            targetAudience: 'Small Businesses',
            popular: true
          },
          {
            name: 'Business',
            monthlyPrice: 2999,
            yearlyPrice: 29999,
            targetAudience: 'Established Companies',
            recommended: true
          },
          {
            name: 'Enterprise',
            monthlyPrice: 'Custom',
            yearlyPrice: 'Custom',
            targetAudience: 'Large Organizations'
          }
        ],
        lastUpdated: new Date().toISOString().split('T')[0]
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
const comparePlans = (req, res) => {
  try {
    const plansComparison = {
      starter: {
        price: { monthly: 299, yearly: 2999 },
        volumeLimit: 500000,
        transactionLimit: 200,
        features: {
          paymentLinks: true,
          apiAccess: false,
          customBranding: false,
          dedicatedSupport: false,
          advancedAnalytics: false
        },
        transactionFees: {
          domestic: '2.5% + ₹3',
          international: '3.5% + ₹5',
          upi: '1.5%'
        },
        payoutSpeed: 'T+3'
      },
      professional: {
        price: { monthly: 999, yearly: 9999 },
        volumeLimit: 2500000,
        transactionLimit: 1000,
        features: {
          paymentLinks: true,
          apiAccess: true,
          customBranding: true,
          dedicatedSupport: false,
          advancedAnalytics: true
        },
        transactionFees: {
          domestic: '2.0% + ₹2',
          international: '3.0% + ₹5',
          upi: '1.0%'
        },
        payoutSpeed: 'T+2'
      },
      business: {
        price: { monthly: 2999, yearly: 29999 },
        volumeLimit: 10000000,
        transactionLimit: 'unlimited',
        features: {
          paymentLinks: true,
          apiAccess: true,
          customBranding: true,
          dedicatedSupport: true,
          advancedAnalytics: true
        },
        transactionFees: {
          domestic: '1.75% + ₹2',
          international: '2.75% + ₹5',
          upi: '0.8%'
        },
        payoutSpeed: 'T+1'
      },
      enterprise: {
        price: { monthly: 'custom', yearly: 'custom' },
        volumeLimit: 'unlimited',
        transactionLimit: 'unlimited',
        features: {
          paymentLinks: true,
          apiAccess: true,
          customBranding: true,
          dedicatedSupport: true,
          advancedAnalytics: true,
          customIntegrations: true,
          sla: true
        },
        transactionFees: {
          domestic: 'Custom (as low as 1.2%)',
          international: 'Negotiable',
          upi: '0.5%'
        },
        payoutSpeed: 'Instant'
      }
    };
    
    res.json({
      success: true,
      data: plansComparison
    });
  } catch (error) {
    console.error('Error comparing plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve plan comparison'
    });
  }
};

module.exports = {
  getPricingPage,
  calculateCustomQuote,
  comparePlans
};
