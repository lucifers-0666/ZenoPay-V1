// Privacy Policy Page JavaScript
// Configuration is passed via data attributes on the body element

document.addEventListener('DOMContentLoaded', function () {
  // Get configuration from data attributes
  const isUserLoggedIn = document.body.dataset.userLoggedIn === 'true';
  const policyVersion = document.body.dataset.policyVersion || 'unknown';

  console.log(`Privacy Policy loaded - Version: ${policyVersion}, User logged in: ${isUserLoggedIn}`);

  // Sticky TOC Functionality
  const sidebar = document.getElementById('termsSidebar');
  const tocLinks = document.querySelectorAll('.toc-link');
  const sections = document.querySelectorAll('.terms-section');

  // Intersection Observer for active section highlighting
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -70% 0px',
    threshold: 0
  };


  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.id;
        tocLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // Smooth scroll for TOC links
  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Search Functionality
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  let searchTimeout;

  if (searchInput && searchResults) {
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        performSearch(this.value);
      }, 300);
    });
  }

  function performSearch(query) {
    // Remove previous highlights
    const highlighted = document.querySelectorAll('.highlight-match');
    highlighted.forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      }
    });

    if (!query || query.length < 3 || !searchResults) {
      if (searchResults) {
        searchResults.textContent = '';
      }
      return;
    }

    const regex = new RegExp(query, 'gi');
    let matchCount = 0;

    sections.forEach(section => {
      const text = section.textContent;
      const matches = text.match(regex);
      if (matches) {
        matchCount += matches.length;
        highlightText(section, query);
      }
    });

    if (matchCount > 0) {
      searchResults.textContent = `${matchCount} result${matchCount > 1 ? 's' : ''} found`;

      // Scroll to first match
      const firstMatch = document.querySelector('.highlight-match');
      if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      searchResults.textContent = 'No results found';
    }
  }

  function highlightText(element, query) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    const regex = new RegExp(`(${query})`, 'gi');

    textNodes.forEach(node => {
      const text = node.textContent;
      if (regex.test(text)) {
        const span = document.createElement('span');
        span.innerHTML = text.replace(regex, '<span class="highlight-match">$1</span>');
        node.parentNode.replaceChild(span, node);
      }
    });
  }

  // Accept Policy Function
  window.acceptPolicy = async function () {
    if (!isUserLoggedIn) {
      alert('Please log in to accept the privacy policy.');
      window.location.href = '/login?redirect=/privacy-policy';
      return;
    }

    try {
      const response = await fetch('/api/privacy-policy/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: policyVersion
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Thank you for accepting our Privacy Policy!');
        location.reload();
      } else {
        alert('Error: ' + (data.message || 'Failed to record acceptance'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  };
});

