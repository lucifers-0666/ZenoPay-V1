// Support Center JavaScript

// Search functionality
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchSuggestions = document.getElementById('search-suggestions');
let searchTimeout;

searchInput?.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();
  
  if (query.length < 2) {
    searchSuggestions.hidden = true;
    return;
  }
  
  searchTimeout = setTimeout(async () => {
    try {
      const response = await fetch(`/support/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (data.success && data.results.length > 0) {
        displaySearchSuggestions(data.results);
      } else {
        searchSuggestions.hidden = true;
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  }, 300);
});

function displaySearchSuggestions(results) {
  searchSuggestions.innerHTML = results.slice(0, 5).map(result => `
    <div class="suggestion-item">
      <i class="fas fa-file-alt"></i>
      <div>
        <strong>${result.title}</strong>
        <p>${result.excerpt}</p>
      </div>
    </div>
  `).join('');
  searchSuggestions.hidden = false;
}

// Search on Enter or button click
const performSearch = () => {
  const query = searchInput.value.trim();
  if (query) {
    window.location.href = `/support/search?query=${encodeURIComponent(query)}`;
  }
};

searchInput?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') performSearch();
});

searchBtn?.addEventListener('click', performSearch);

// Popular search tags
document.querySelectorAll('.search-tag').forEach(tag => {
  tag.addEventListener('click', (e) => {
    e.preventDefault();
    searchInput.value = tag.textContent;
    performSearch();
  });
});

// Live Chat
const startChatBtn = document.getElementById('start-chat-btn');
const chatModal = document.getElementById('chat-modal');
const closeChatModal = document.getElementById('close-chat-modal');

startChatBtn?.addEventListener('click', async () => {
  chatModal.hidden = false;
  
  try {
    const response = await fetch('/support/chat/initiate', { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      setTimeout(() => {
        document.querySelector('.chat-loading').innerHTML = `
          <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--success);"></i>
          <p><strong>Connected!</strong></p>
          <p>Chat session ID: ${data.chatSession.sessionId}</p>
        `;
      }, 2000);
    }
  } catch (error) {
    console.error('Chat error:', error);
    showToast('Failed to start chat. Please try again.', 'error');
  }
});

closeChatModal?.addEventListener('click', () => {
  chatModal.hidden = true;
});

// Close modal on outside click
chatModal?.addEventListener('click', (e) => {
  if (e.target === chatModal) {
    chatModal.hidden = true;
  }
});

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  
  setTimeout(() => {
    toast.hidden = true;
  }, 4000);
}

// Hide search suggestions on outside click
document.addEventListener('click', (e) => {
  if (!searchInput?.contains(e.target) && !searchSuggestions?.contains(e.target)) {
    searchSuggestions.hidden = true;
  }
});
