// Report Issue JavaScript

const form = document.getElementById('issue-form');
const categorySelect = document.getElementById('issue-category');
const descriptionTextarea = document.getElementById('description');
const charCount = document.getElementById('char-count');
const charMin = document.getElementById('char-min');
const transactionGroup = document.getElementById('transaction-group');
const transactionIdInput = document.getElementById('transaction-id');
const recentTransactionsSelect = document.getElementById('recent-transactions');
const contactPhoneCheckbox = document.getElementById('contact-phone');
const contactTimeGroup = document.getElementById('contact-time-group');
const fileInput = document.getElementById('file-input');
const uploadZone = document.getElementById('upload-zone');
const fileList = document.getElementById('file-list');
const saveDraftBtn = document.getElementById('save-draft-btn');
const submitBtn = document.getElementById('submit-btn');
const successModal = document.getElementById('success-modal');
const autoSaveStatus = document.getElementById('auto-save-status');

let selectedFiles = [];
let autoSaveInterval;

// Character counter
descriptionTextarea.addEventListener('input', () => {
  const length = descriptionTextarea.value.length;
  charCount.textContent = length;
  
  if (length > 0 && length < 50) {
    charMin.hidden = false;
  } else {
    charMin.hidden = true;
  }
});

// Show transaction field for payment-related issues
categorySelect.addEventListener('change', () => {
  const category = categorySelect.value;
  if (category === 'payment-failed' || category === 'transaction-dispute') {
    transactionGroup.hidden = false;
  } else {
    transactionGroup.hidden = true;
  }
  
  // Check for similar issues
  checkSimilarIssues();
});

// Auto-fill transaction ID from dropdown
recentTransactionsSelect?.addEventListener('change', () => {
  if (recentTransactionsSelect.value) {
    transactionIdInput.value = recentTransactionsSelect.value;
  }
});

// Show preferred time when phone selected
contactPhoneCheckbox.addEventListener('change', () => {
  contactTimeGroup.hidden = !contactPhoneCheckbox.checked;
});

// File upload
uploadZone.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.style.borderColor = 'var(--primary)';
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.style.borderColor = 'var(--border)';
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.style.borderColor = 'var(--border)';
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
  handleFiles(e.target.files);
});

function handleFiles(files) {
  Array.from(files).forEach(file => {
    if (selectedFiles.length >= 3) {
      showToast('Maximum 3 files allowed', 'error');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      showToast(`${file.name} is too large. Max 5MB per file.`, 'error');
      return;
    }
    
    selectedFiles.push(file);
  });
  
  displayFiles();
}

function displayFiles() {
  fileList.innerHTML = selectedFiles.map((file, index) => `
    <div class="file-item">
      <i class="fas fa-file"></i>
      <span>${file.name}</span>
      <span class="file-size">${(file.size / 1024).toFixed(1)} KB</span>
      <button type="button" class="remove-file-btn" data-index="${index}">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `).join('');
  
  document.querySelectorAll('.remove-file-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      selectedFiles.splice(index, 1);
      displayFiles();
    });
  });
}

// Check similar issues
async function checkSimilarIssues() {
  const query = `${categorySelect.value} ${descriptionTextarea.value}`.trim();
  
  if (query.length < 10) return;
  
  try {
    const response = await fetch('/report-issue/check-similar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    
    if (data.success && data.similarIssues.length > 0) {
      const similarIssuesDiv = document.getElementById('similar-issues');
      const similarIssuesList = document.getElementById('similar-issues-list');
      
      similarIssuesList.innerHTML = data.similarIssues.map(issue => `
        <div class="similar-issue">
          <strong>${issue.title}</strong>
          <p>${issue.solution}</p>
          <span class="helpful-count">${issue.helpfulCount} found this helpful</span>
        </div>
      `).join('');
      
      similarIssuesDiv.hidden = false;
    }
  } catch (error) {
    console.error('Error checking similar issues:', error);
  }
}

// Auto-save draft
function startAutoSave() {
  autoSaveInterval = setInterval(async () => {
    const formData = {
      category: categorySelect.value,
      subject: document.getElementById('subject').value,
      description: descriptionTextarea.value,
      priority: document.querySelector('input[name="priority"]:checked')?.value
    };
    
    if (!formData.subject && !formData.description) return;
    
    try {
      await fetch('/report-issue/save-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      autoSaveStatus.innerHTML = '<i class="fas fa-check-circle"></i> Draft saved';
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, 30000); // Every 30 seconds
}

// Manual save draft
saveDraftBtn.addEventListener('click', async () => {
  try {
    const formData = {
      category: categorySelect.value,
      subject: document.getElementById('subject').value,
      description: descriptionTextarea.value,
      priority: document.querySelector('input[name="priority"]:checked')?.value
    };
    
    const response = await fetch('/report-issue/save-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('Draft saved successfully', 'success');
    }
  } catch (error) {
    showToast('Failed to save draft', 'error');
  }
});

// Form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    category: categorySelect.value,
    subject: document.getElementById('subject').value,
    description: descriptionTextarea.value,
    transactionId: transactionIdInput.value,
    priority: document.querySelector('input[name="priority"]:checked')?.value,
    contactEmail: document.getElementById('contact-email').checked,
    contactPhone: document.getElementById('contact-phone').checked,
    preferredContactTime: document.getElementById('preferred-time')?.value
  };
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
  
  try {
    const response = await fetch('/report-issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      document.getElementById('ticket-number').textContent = data.ticketNumber;
      document.getElementById('response-time').textContent = data.expectedResponseTime;
      successModal.hidden = false;
      clearInterval(autoSaveInterval);
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    showToast(error.message || 'Failed to submit issue', 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Issue';
  }
});

// Track ticket button
document.getElementById('track-ticket-btn')?.addEventListener('click', () => {
  window.location.href = '/support';
});

// Toast
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  setTimeout(() => toast.hidden = true, 4000);
}

// Start auto-save on page load
startAutoSave();

// Check similar issues on description change
descriptionTextarea.addEventListener('input', debounce(checkSimilarIssues, 1000));

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
