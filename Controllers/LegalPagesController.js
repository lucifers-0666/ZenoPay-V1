/**
 * Legal Pages Controller
 * Handles rendering of legal documents (Terms, Privacy Policy)
 */

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

// Get Public API Docs page
const getAPIDocsPage = (req, res) => {
  try {
    res.render('api-docs', {
      pageTitle: 'API Documentation - ZenoPay',
      isLoggedIn: req.session?.isLoggedIn || false,
      user: req.session?.user || null,
      userData: req.session?.user || null
    });
  } catch (error) {
    console.error('Error rendering API docs page:', error);
    res.status(500).render('error-500', {
      pageTitle: 'Error - ZenoPay',
      error: 'Failed to load API Documentation page',
      isLoggedIn: false,
      user: null
    });
  }
};

module.exports = {
  getPrivacyPage,
  getAboutPage,
  getHelpPage,
  getContactPage,
  getAPIIntegrationPage,
  getAPIDocsPage,
};
