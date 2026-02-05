/**
 * Legal Pages Controller
 * Handles rendering of legal documents (Terms, Privacy Policy)
 */

// Get Terms & Conditions page
const getTermsPage = (req, res) => {
  try {
    res.render('terms', {
      pageTitle: 'Terms & Conditions - ZenoPay',
      isLoggedIn: req.session?.isLoggedIn || false,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('Error rendering terms page:', error);
    res.status(500).render('error-500', {
      pageTitle: 'Error - ZenoPay',
      error: 'Failed to load Terms & Conditions',
      isLoggedIn: false,
      user: null
    });
  }
};

// Get Privacy Policy page
const getPrivacyPage = (req, res) => {
  try {
    res.render('privacy', {
      pageTitle: 'Privacy Policy - ZenoPay',
      isLoggedIn: req.session?.isLoggedIn || false,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('Error rendering privacy page:', error);
    res.status(500).render('error-500', {
      pageTitle: 'Error - ZenoPay',
      error: 'Failed to load Privacy Policy',
      isLoggedIn: false,
      user: null
    });
  }
};

// Get About Us page
const getAboutPage = (req, res) => {
  try {
    res.render('about', {
      pageTitle: 'About Us - ZenoPay',
      isLoggedIn: req.session?.isLoggedIn || false,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('Error rendering about page:', error);
    res.status(500).render('error-500', {
      pageTitle: 'Error - ZenoPay',
      error: 'Failed to load About Us page',
      isLoggedIn: false,
      user: null
    });
  }
};

// Get Help Center page
const getHelpPage = (req, res) => {
  try {
    res.render('help', {
      pageTitle: 'Help Center - ZenoPay',
      isLoggedIn: req.session?.isLoggedIn || false,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('Error rendering help page:', error);
    res.status(500).render('error-500', {
      pageTitle: 'Error - ZenoPay',
      error: 'Failed to load Help Center',
      isLoggedIn: false,
      user: null
    });
  }
};

// Get Contact Us page
const getContactPage = (req, res) => {
  try {
    res.render('contact', {
      pageTitle: 'Contact Us - ZenoPay',
      isLoggedIn: req.session?.isLoggedIn || false,
      user: req.session?.user || null,
      userData: req.session?.user || null
    });
  } catch (error) {
    console.error('Error rendering contact page:', error);
    res.status(500).render('error-500', {
      pageTitle: 'Error - ZenoPay',
      error: 'Failed to load Contact Us page',
      isLoggedIn: false,
      user: null
    });
  }
};

// API endpoint to get terms version info
const getTermsVersion = (req, res) => {
  try {
    res.json({
      success: true,
      version: '2.0',
      effectiveDate: '2026-01-01',
      lastUpdated: '2026-01-29',
      sections: 15
    });
  } catch (error) {
    console.error('Error getting terms version:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve terms version'
    });
  }
};

// API endpoint to accept terms
const acceptTerms = async (req, res) => {
  try {
    if (!req.session?.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const ZenoPayDetails = require('../Models/ZenoPayUser');
    const userId = req.session.user._id;

    // Update user's terms acceptance
    await ZenoPayDetails.findByIdAndUpdate(userId, {
      TermsAccepted: true,
      TermsAcceptedDate: new Date(),
      TermsVersion: '2.0'
    });

    res.json({
      success: true,
      message: 'Terms accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting terms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record terms acceptance'
    });
  }
};

// Get API Integration page
const getAPIIntegrationPage = (req, res) => {
  try {
    res.render('api-integration', {
      pageTitle: 'API Integration - ZenoPay',
      isLoggedIn: req.session?.isLoggedIn || false,
      user: req.session?.user || null,
      userData: req.session?.user || null
    });
  } catch (error) {
    console.error('Error rendering API integration page:', error);
    res.status(500).render('error-500', {
      pageTitle: 'Error - ZenoPay',
      error: 'Failed to load API Integration page',
      isLoggedIn: false,
      user: null
    });
  }
};

module.exports = {
  getTermsPage,
  getPrivacyPage,
  getAboutPage,
  getHelpPage,
  getContactPage,
  getAPIIntegrationPage,
  getTermsVersion,
  acceptTerms
};
