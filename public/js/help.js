// Help Center Page - Interactive Features

document.addEventListener('DOMContentLoaded', function() {
  
  // ===============================
  // Search Functionality
  // ===============================
  
  const searchInput = document.getElementById('helpSearch');
  const clearSearch = document.getElementById('clearSearch');
  const searchSuggestions = document.getElementById('searchSuggestions');
  const suggestionsListContainer = searchSuggestions.querySelector('.suggestions-list');
  
  // Sample search data (In production, this would come from your backend)
  const searchData = [
    { title: 'How to send money', category: 'Payments', icon: 'fa-money-bill-transfer', categorySlug: 'payments' },
    { title: 'Reset my password', category: 'Account', icon: 'fa-lock', categorySlug: 'account' },
    { title: 'Add a bank account', category: 'Account', icon: 'fa-building-columns', categorySlug: 'account' },
    { title: 'Transaction fees', category: 'Billing', icon: 'fa-indian-rupee-sign', categorySlug: 'billing' },
    { title: 'Enable two-factor authentication', category: 'Security', icon: 'fa-shield-alt', categorySlug: 'security' },
    { title: 'KYC verification documents', category: 'Getting Started', icon: 'fa-id-card', categorySlug: 'getting-started' },
    { title: 'Failed transaction refund', category: 'Troubleshooting', icon: 'fa-rotate-left', categorySlug: 'troubleshooting' },
    { title: 'API authentication', category: 'API', icon: 'fa-code', categorySlug: 'api' },
    { title: 'Download transaction history', category: 'Account', icon: 'fa-download', categorySlug: 'account' },
    { title: 'Payment methods supported', category: 'Payments', icon: 'fa-credit-card', categorySlug: 'payments' },
    { title: 'Account security tips', category: 'Security', icon: 'fa-shield-alt', categorySlug: 'security' },
    { title: 'Report fraud or suspicious activity', category: 'Security', icon: 'fa-triangle-exclamation', categorySlug: 'security' },
    { title: 'Create a ZenoPay account', category: 'Getting Started', icon: 'fa-user-plus', categorySlug: 'getting-started' },
    { title: 'Transfer time duration', category: 'Payments', icon: 'fa-clock', categorySlug: 'payments' },
  ];
  
  // Search input event
  searchInput.addEventListener('input', function(e) {
    const query = e.target.value.trim().toLowerCase();
    
    if (query.length > 0) {
      clearSearch.style.display = 'flex';
      
      // Filter search data
      const filteredResults = searchData.filter(item => 
        item.title.toLowerCase().includes(query) || 
        item.category.toLowerCase().includes(query)
      );
      
      if (filteredResults.length > 0) {
        displaySuggestions(filteredResults.slice(0, 6)); // Show top 6 results
      } else {
        displayNoResults();
      }
    } else {
      clearSearch.style.display = 'none';
      searchSuggestions.style.display = 'none';
    }
  });
  
  // Clear search
  clearSearch.addEventListener('click', function() {
    searchInput.value = '';
    clearSearch.style.display = 'none';
    searchSuggestions.style.display = 'none';
    searchInput.focus();
  });
  
  // Display suggestions
  function displaySuggestions(results) {
    suggestionsListContainer.innerHTML = '';
    
    results.forEach(item => {
      const suggestionItem = document.createElement('div');
      suggestionItem.className = 'suggestion-item';
      suggestionItem.innerHTML = `
        <div class="suggestion-icon">
          <i class="fas ${item.icon}"></i>
        </div>
        <div class="suggestion-text">
          <span class="suggestion-title">${highlightMatch(item.title, searchInput.value)}</span>
          <span class="suggestion-category">${item.category}</span>
        </div>
        <i class="fas fa-chevron-right suggestion-chevron"></i>
      `;
      
      // Click to filter FAQ by category
      suggestionItem.addEventListener('click', function() {
        filterFAQsByCategory(item.categorySlug);
        searchInput.value = '';
        searchSuggestions.style.display = 'none';
        clearSearch.style.display = 'none';
        
        // Scroll to FAQ section
        document.querySelector('.faq-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      
      suggestionsListContainer.appendChild(suggestionItem);
    });
    
    searchSuggestions.style.display = 'block';
  }
  
  // Display no results
  function displayNoResults() {
    suggestionsListContainer.innerHTML = `
      <div style="padding: 24px; text-align: center; color: #6B7280;">
        <i class="fas fa-search" style="font-size: 32px; margin-bottom: 12px; opacity: 0.5;"></i>
        <p style="font-size: 14px;">No results found. Try a different search term.</p>
      </div>
    `;
    searchSuggestions.style.display = 'block';
  }
  
  // Highlight matching text
  function highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<strong style="color: #3B82F6;">$1</strong>');
  }
  
  // Close suggestions when clicking outside
  document.addEventListener('click', function(e) {
    if (!searchInput.contains(e.target) && !searchSuggestions.contains(e.target)) {
      searchSuggestions.style.display = 'none';
    }
  });
  
  // Popular search tags
  const popularTags = document.querySelectorAll('.popular-tag');
  popularTags.forEach(tag => {
    tag.addEventListener('click', function() {
      const query = this.getAttribute('data-query');
      searchInput.value = query;
      searchInput.dispatchEvent(new Event('input'));
      searchInput.focus();
    });
  });
  
  // ===============================
  // Category Cards Click
  // ===============================
  
  const categoryCards = document.querySelectorAll('.category-card');
  categoryCards.forEach(card => {
    card.addEventListener('click', function() {
      const category = this.getAttribute('data-category');
      filterFAQsByCategory(category);
      
      // Scroll to FAQ section
      document.querySelector('.faq-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  
  // ===============================
  // FAQ Accordion
  // ===============================
  
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    
    question.addEventListener('click', function() {
      const isActive = item.classList.contains('active');
      
      // Close all other items (optional - remove if you want multiple open at once)
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
        }
      });
      
      // Toggle current item
      if (isActive) {
        item.classList.remove('active');
      } else {
        item.classList.add('active');
      }
    });
  });
  
  // ===============================
  // FAQ Category Tabs
  // ===============================
  
  const faqTabs = document.querySelectorAll('.faq-tab');
  
  faqTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const category = this.getAttribute('data-category');
      
      // Update active tab
      faqTabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      // Filter FAQs
      filterFAQsByCategory(category);
    });
  });
  
  function filterFAQsByCategory(category) {
    // Update active tab
    faqTabs.forEach(tab => {
      if (tab.getAttribute('data-category') === category) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Show/hide FAQ items
    faqItems.forEach(item => {
      const itemCategory = item.getAttribute('data-category');
      
      if (category === 'all') {
        item.classList.remove('hidden');
      } else {
        if (itemCategory === category) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
          item.classList.remove('active'); // Close hidden items
        }
      }
    });
  }
  
  // ===============================
  // Feedback System
  // ===============================
  
  const feedbackButtons = document.querySelectorAll('.feedback-btn');
  const feedbackThankYou = document.querySelector('.feedback-thank-you');
  const feedbackButtonsContainer = document.querySelector('.feedback-buttons');
  
  feedbackButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const feedbackType = this.getAttribute('data-feedback');
      
      // Hide buttons and show thank you message
      feedbackButtonsContainer.style.display = 'none';
      feedbackThankYou.style.display = 'flex';
      
      // In production, send feedback to backend
      console.log(`User feedback: ${feedbackType}`);
      
      // Optional: Send to backend
      // sendFeedback(feedbackType);
    });
  });
  
  // Function to send feedback to backend (implement as needed)
  function sendFeedback(feedbackType) {
    fetch('/api/help/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        feedback: feedbackType,
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Feedback sent successfully:', data);
    })
    .catch(error => {
      console.error('Error sending feedback:', error);
    });
  }
  
  // ===============================
  // Scroll Animations
  // ===============================
  
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe category cards
  categoryCards.forEach(card => {
    observer.observe(card);
  });
  
  // Observe FAQ items
  faqItems.forEach(item => {
    observer.observe(item);
  });
  
  // Observe help action cards
  const helpActionCards = document.querySelectorAll('.help-action-card');
  helpActionCards.forEach(card => {
    observer.observe(card);
  });
  
  // ===============================
  // Keyboard Shortcuts
  // ===============================
  
  document.addEventListener('keydown', function(e) {
    // Cmd/Ctrl + K: Focus search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
    
    // Escape: Clear search and close suggestions
    if (e.key === 'Escape') {
      if (searchInput.value) {
        searchInput.value = '';
        clearSearch.style.display = 'none';
        searchSuggestions.style.display = 'none';
      }
    }
  });
  
  // ===============================
  // URL Hash Navigation
  // ===============================
  
  // If URL has hash, open corresponding FAQ item
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const targetFaq = document.querySelector(`[data-faq-id="${hash}"]`);
    
    if (targetFaq) {
      setTimeout(() => {
        targetFaq.classList.add('active');
        targetFaq.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }
  
  // ===============================
  // Analytics Tracking (Optional)
  // ===============================
  
  // Track search queries
  searchInput.addEventListener('blur', function() {
    const query = this.value.trim();
    if (query) {
      trackEvent('help_search', { query: query });
    }
  });
  
  // Track category clicks
  categoryCards.forEach(card => {
    card.addEventListener('click', function() {
      const category = this.getAttribute('data-category');
      trackEvent('category_clicked', { category: category });
    });
  });
  
  // Track FAQ opens
  faqItems.forEach(item => {
    item.querySelector('.faq-question').addEventListener('click', function() {
      const question = this.querySelector('span').textContent;
      trackEvent('faq_opened', { question: question });
    });
  });
  
  // Generic event tracking function
  function trackEvent(eventName, eventData) {
    // Implement your analytics tracking here
    // Example: Google Analytics, Mixpanel, etc.
    console.log('Event tracked:', eventName, eventData);
    
    // Example: Google Analytics
    // if (typeof gtag !== 'undefined') {
    //   gtag('event', eventName, eventData);
    // }
  }
  
  // ===============================
  // Smooth Scroll for Anchor Links
  // ===============================
  
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
  
});
