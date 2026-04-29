/**
 * Pricing Page Interactive Functionality
 * Handles billing toggle (monthly/yearly) and FAQ accordion
 */

document.addEventListener('DOMContentLoaded', function() {
  // ═══════════════════════════════════════════════════════════════
  // BILLING TOGGLE (Monthly/Yearly)
  // ═══════════════════════════════════════════════════════════════
  
  const billingToggle = document.getElementById('billingToggle');
  const monthlyLabel = document.getElementById('monthlyLabel');
  const yearlyLabel = document.getElementById('yearlyLabel');
  
  // Pricing data for each plan
  const pricingData = {
    starter: {
      monthly: 299,
      yearly: 249,
      yearlyTotal: 2999,
      savings: 600
    },
    professional: {
      monthly: 999,
      yearly: 833,
      yearlyTotal: 9999,
      savings: 2000
    },
    business: {
      monthly: 2999,
      yearly: 2499,
      yearlyTotal: 29999,
      savings: 6000
    }
  };
  
  if (billingToggle) {
    // Set initial state to monthly so the public page mirrors the admin plan prices.
    billingToggle.checked = false;
    updatePricing(false);
    updateLabels(false);
    
    billingToggle.addEventListener('change', function() {
      const isYearly = this.checked;
      updatePricing(isYearly);
      updateLabels(isYearly);
    });
  }
  
  function updatePricing(isYearly) {
    const pricingCards = document.querySelectorAll('.pricing-card');
    
    pricingCards.forEach((card, index) => {
      const monthlyPrice = card.querySelector('.monthly-price');
      const yearlyPrice = card.querySelector('.yearly-price');
      const yearlyInfo = card.querySelector('.yearly-info');
      
      if (monthlyPrice && yearlyPrice) {
        if (isYearly) {
          monthlyPrice.style.display = 'none';
          yearlyPrice.style.display = 'inline';
          if (yearlyInfo) {
            yearlyInfo.style.display = 'block';
          }
        } else {
          monthlyPrice.style.display = 'inline';
          yearlyPrice.style.display = 'none';
          if (yearlyInfo) {
            yearlyInfo.style.display = 'none';
          }
        }
      }
    });
  }
  
  function updateLabels(isYearly) {
    if (isYearly) {
      monthlyLabel.classList.remove('active');
      yearlyLabel.classList.add('active');
    } else {
      monthlyLabel.classList.add('active');
      yearlyLabel.classList.remove('active');
    }
  }
  
  // ═══════════════════════════════════════════════════════════════
  // FAQ ACCORDION
  // ═══════════════════════════════════════════════════════════════
  
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', function() {
      // Close other open FAQ items
      faqItems.forEach(otherItem => {
        if (otherItem !== item && otherItem.classList.contains('active')) {
          otherItem.classList.remove('active');
        }
      });
      
      // Toggle current item
      item.classList.toggle('active');
    });
  });
  
  // ═══════════════════════════════════════════════════════════════
  // SMOOTH SCROLL FOR ANCHOR LINKS
  // ═══════════════════════════════════════════════════════════════
  
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // ═══════════════════════════════════════════════════════════════
  // CTA BUTTON HANDLERS
  // ═══════════════════════════════════════════════════════════════
  
  // Get Started buttons
  const getStartedButtons = document.querySelectorAll('.cta-button.primary-btn');
  getStartedButtons.forEach(button => {
    if (button.textContent.trim() === 'Get Started') {
      button.addEventListener('click', function() {
        // Redirect to signup page
        window.location.href = '/signup';
      });
    }
  });
  
  // Contact Sales buttons
  const contactSalesButtons = document.querySelectorAll('.cta-button.secondary-btn, .enterprise-btn.primary');
  contactSalesButtons.forEach(button => {
    if (button.textContent.includes('Contact Sales')) {
      button.addEventListener('click', function() {
        // Redirect to contact page
        window.location.href = '/contact';
      });
    }
  });
  
  // Schedule Demo buttons
  const scheduleDemoButtons = document.querySelectorAll('.enterprise-btn.secondary');
  scheduleDemoButtons.forEach(button => {
    if (button.textContent.includes('Schedule a Demo')) {
      button.addEventListener('click', function() {
        // Redirect to contact page with demo parameter
        window.location.href = '/contact?type=demo';
      });
    }
  });
  
  // GST Benefits button
  const gstButton = document.querySelector('.gst-cta-button');
  if (gstButton) {
    gstButton.addEventListener('click', function() {
      // Scroll to FAQ or open GST benefits modal
      const faqSection = document.querySelector('.faq-section');
      if (faqSection) {
        faqSection.scrollIntoView({ behavior: 'smooth' });
        
        // Auto-open GST FAQ item
        setTimeout(() => {
          const gstFaqItem = Array.from(faqItems).find(item => 
            item.querySelector('.faq-question span').textContent.includes('GST')
          );
          if (gstFaqItem) {
            gstFaqItem.classList.add('active');
          }
        }, 500);
      }
    });
  }
  
  // Start Free Trial button
  const freeTrialButtons = document.querySelectorAll('.bottom-cta-btn.primary');
  freeTrialButtons.forEach(button => {
    if (button.textContent.includes('Free Trial')) {
      button.addEventListener('click', function() {
        window.location.href = '/signup?trial=true';
      });
    }
  });
  
  // View Documentation button
  const docButtons = document.querySelectorAll('.bottom-cta-btn.secondary');
  docButtons.forEach(button => {
    if (button.textContent.includes('Documentation')) {
      button.addEventListener('click', function() {
        window.location.href = '/api-integration';
      });
    }
  });
  
  // ═══════════════════════════════════════════════════════════════
  // SCROLL ANIMATIONS (Optional enhancement)
  // ═══════════════════════════════════════════════════════════════
  
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // Apply fade-in animation to pricing cards
  const cards = document.querySelectorAll('.pricing-card');
  cards.forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
  });
  
  // Apply fade-in to security features
  const securityFeatures = document.querySelectorAll('.security-feature');
  securityFeatures.forEach((feature, index) => {
    feature.style.opacity = '0';
    feature.style.transform = 'translateY(20px)';
    feature.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(feature);
  });
  
  // ═══════════════════════════════════════════════════════════════
  // KEYBOARD ACCESSIBILITY
  // ═══════════════════════════════════════════════════════════════
  
  // Allow Enter/Space to toggle FAQ items
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.setAttribute('tabindex', '0');
    question.setAttribute('role', 'button');
    question.setAttribute('aria-expanded', 'false');
    
    question.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        question.click();
        const isActive = item.classList.contains('active');
        question.setAttribute('aria-expanded', isActive ? 'true' : 'false');
      }
    });
  });
  
  // ═══════════════════════════════════════════════════════════════
  // PRICE CALCULATOR (Optional - could be added later)
  // ═══════════════════════════════════════════════════════════════
  
  // This could be implemented as a floating widget or modal
  // that calculates estimated costs based on user's expected volume
  
});

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Format number as Indian currency
 */
function formatIndianCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
}

/**
 * Calculate transaction fees
 */
function calculateFees(volume, plan) {
  const feeRates = {
    starter: 0.025,
    professional: 0.020,
    business: 0.0175,
    enterprise: 0.012
  };
  
  const flatFees = {
    starter: 3,
    professional: 2,
    business: 2,
    enterprise: 0
  };
  
  const rate = feeRates[plan] || 0;
  const flat = flatFees[plan] || 0;
  
  // Assuming average transaction size for calculation
  const avgTransactionSize = 1000;
  const numTransactions = volume / avgTransactionSize;
  
  const percentageFees = volume * rate;
  const flatFeesTotal = numTransactions * flat;
  
  return percentageFees + flatFeesTotal;
}

/**
 * Determine recommended plan based on volume
 */
function getRecommendedPlan(monthlyVolume) {
  if (monthlyVolume <= 500000) return 'starter';
  if (monthlyVolume <= 2500000) return 'professional';
  if (monthlyVolume <= 10000000) return 'business';
  return 'enterprise';
}

// Export functions for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatIndianCurrency,
    calculateFees,
    getRecommendedPlan
  };
}
