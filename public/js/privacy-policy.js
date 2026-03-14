// Privacy Policy Page JavaScript
// Configuration is passed via data attributes on the body element

document.addEventListener('DOMContentLoaded', function () {
  // Get configuration from data attributes
  const isUserLoggedIn = document.body.dataset.userLoggedIn === 'true';
  const policyVersion = document.body.dataset.policyVersion || 'unknown';

  console.log(`Privacy Policy loaded - Version: ${policyVersion}, User logged in: ${isUserLoggedIn}`);

  // Sticky TOC Functionality
  const tocWrapper = document.getElementById('termsSidebar');
  const tocLinks = Array.from(document.querySelectorAll('.toc-item[data-section]'));
  const sections = Array.from(document.querySelectorAll('.terms-section[id]'));
  const NAVBAR_HEIGHT = 80;
  const ACTIVE_OFFSET = NAVBAR_HEIGHT + 40;
  let currentActive = sections[0] ? sections[0].id : '';

  function setActive(sectionId, shouldScrollToc = true) {
    tocLinks.forEach(link => {
      const isActive = link.dataset.section === sectionId;
      link.classList.toggle('toc-active', isActive);

      if (isActive) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    if (!shouldScrollToc || !tocWrapper) {
      return;
    }

    const activeLink = document.querySelector(`.toc-item[data-section="${sectionId}"]`);
    if (activeLink) {
      const targetScrollTop = activeLink.offsetTop - (tocWrapper.clientHeight / 2) + (activeLink.clientHeight / 2);
      tocWrapper.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth'
      });
    }
  }

  if (tocLinks.length && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          currentActive = entry.target.id;
          setActive(currentActive);
        }
      });
    }, {
      root: null,
      rootMargin: `-${ACTIVE_OFFSET}px 0px -40% 0px`,
      threshold: 0
    });

    sections.forEach(section => observer.observe(section));

    let scrollTimer;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        let closest = null;
        let closestDist = Infinity;

        sections.forEach(section => {
          const rect = section.getBoundingClientRect();
          const distFromTop = Math.abs(rect.top - ACTIVE_OFFSET);

          if (rect.top <= ACTIVE_OFFSET && distFromTop < closestDist) {
            closest = section;
            closestDist = distFromTop;
          }
        });

        if (closest && closest.id !== currentActive) {
          currentActive = closest.id;
          setActive(currentActive);
        }
      }, 10);
    }, { passive: true });

    tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.dataset.section;
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
          currentActive = targetId;
          setActive(targetId);

          const targetPosition = targetSection.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT - 16;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          history.pushState(null, '', `#${targetId}`);
        }
      });
    });

    setActive(currentActive, false);
  }

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

