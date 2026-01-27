// Disputes JavaScript

const viewDetailsButtons = document.querySelectorAll('.view-details-btn');
const disputeModal = document.getElementById('dispute-modal');
const closeModalBtn = document.getElementById('close-modal');
const disputeDetailContent = document.getElementById('dispute-detail-content');
const newDisputeBtn = document.getElementById('new-dispute-btn');
const emptyNewDisputeBtn = document.getElementById('empty-new-dispute-btn');
const newDisputeModal = document.getElementById('new-dispute-modal');
const closeNewDisputeModal = document.getElementById('close-new-dispute-modal');
const cancelNewDisputeBtn = document.getElementById('cancel-new-dispute-btn');
const newDisputeForm = document.getElementById('new-dispute-form');

// View dispute details
viewDetailsButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const disputeId = btn.dataset.disputeId;
    disputeModal.hidden = false;
    document.getElementById('modal-dispute-id').textContent = disputeId;
    
    try {
      const response = await fetch(`/disputes/${disputeId}`);
      const data = await response.json();
      
      if (data.success) {
        displayDisputeDetail(data.dispute);
      }
    } catch (error) {
      console.error('Error loading dispute:', error);
      showToast('Failed to load dispute details', 'error');
    }
  });
});

function displayDisputeDetail(dispute) {
  let content = `
    <div class="dispute-detail">
      <div class="status-badge status-${dispute.status}">${dispute.status.replace('-', ' ').toUpperCase()}</div>
      
      <div class="detail-section">
        <h3>Transaction Information</h3>
        <p><strong>Transaction ID:</strong> ${dispute.transactionId}</p>
        <p><strong>Amount:</strong> $${dispute.amount.toFixed(2)}</p>
        <p><strong>Merchant:</strong> ${dispute.merchantName}</p>
      </div>
      
      <div class="detail-section">
        <h3>Dispute Information</h3>
        <p><strong>Reason:</strong> ${dispute.reason}</p>
        <p><strong>Description:</strong> ${dispute.description}</p>
        <p><strong>Submitted:</strong> ${new Date(dispute.submittedDate).toLocaleDateString()}</p>
      </div>
      
      <div class="detail-section">
        <h3>Timeline</h3>
        <div class="timeline">
          ${dispute.timeline.map(item => `
            <div class="timeline-item">
              <div class="timeline-icon ${item.status}">
                <i class="fas fa-${item.status === 'completed' ? 'check' : item.status === 'current' ? 'clock' : 'circle'}"></i>
              </div>
              <div>
                <strong>${item.event}</strong>
                ${item.date ? `<p>${new Date(item.date).toLocaleDateString()}</p>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
  `;
  
  if (dispute.status === 'resolved') {
    content += `
      <div class="detail-section success">
        <h3>Resolution</h3>
        <p><strong>Outcome:</strong> ${dispute.resolution}</p>
        ${dispute.refundAmount ? `<p><strong>Refund Amount:</strong> $${dispute.refundAmount.toFixed(2)}</p>` : ''}
        ${dispute.refundDate ? `<p><strong>Refund Date:</strong> ${new Date(dispute.refundDate).toLocaleDateString()}</p>` : ''}
      </div>
    `;
  } else if (dispute.status === 'open' || dispute.status === 'under-review') {
    content += `
      <div class="detail-actions">
        <button class="btn btn-secondary" onclick="addInformation('${dispute.disputeId}')">
          <i class="fas fa-plus"></i> Add Information
        </button>
        <button class="btn btn-secondary" onclick="withdrawDispute('${dispute.disputeId}')">
          <i class="fas fa-ban"></i> Withdraw Dispute
        </button>
      </div>
    `;
  }
  
  content += `</div>`;
  disputeDetailContent.innerHTML = content;
}

// Close modal
closeModalBtn?.addEventListener('click', () => {
  disputeModal.hidden = true;
});

disputeModal?.addEventListener('click', (e) => {
  if (e.target === disputeModal) {
    disputeModal.hidden = true;
  }
});

// New dispute
[newDisputeBtn, emptyNewDisputeBtn].forEach(btn => {
  btn?.addEventListener('click', () => {
    newDisputeModal.hidden = false;
  });
});

closeNewDisputeModal?.addEventListener('click', () => {
  newDisputeModal.hidden = true;
});

cancelNewDisputeBtn?.addEventListener('click', () => {
  newDisputeModal.hidden = true;
});

newDisputeModal?.addEventListener('click', (e) => {
  if (e.target === newDisputeModal) {
    newDisputeModal.hidden = true;
  }
});

// Submit new dispute
newDisputeForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    transactionId: document.getElementById('new-transaction-id').value,
    reason: document.getElementById('new-dispute-reason').value,
    description: document.getElementById('new-dispute-description').value
  };
  
  try {
    const response = await fetch('/disputes/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('Dispute submitted successfully', 'success');
      newDisputeModal.hidden = true;
      setTimeout(() => location.reload(), 1500);
    } else {
      showToast(data.message, 'error');
    }
  } catch (error) {
    showToast('Failed to submit dispute', 'error');
  }
});

// Add information to dispute
async function addInformation(disputeId) {
  const message = prompt('Enter additional information:');
  if (!message) return;
  
  try {
    const response = await fetch(`/disputes/${disputeId}/add-info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    
    const data = await response.json();
    if (data.success) {
      showToast('Information added successfully', 'success');
    }
  } catch (error) {
    showToast('Failed to add information', 'error');
  }
}

// Withdraw dispute
async function withdrawDispute(disputeId) {
  if (!confirm('Are you sure you want to withdraw this dispute?')) return;
  
  try {
    const response = await fetch(`/disputes/${disputeId}/withdraw`, { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      showToast('Dispute withdrawn', 'success');
      setTimeout(() => location.reload(), 1500);
    }
  } catch (error) {
    showToast('Failed to withdraw dispute', 'error');
  }
}

// Search and filter
document.getElementById('search-input')?.addEventListener('input', debounce(() => {
  applyFilters();
}, 500));

document.getElementById('sort-by')?.addEventListener('change', applyFilters);

function applyFilters() {
  const searchValue = document.getElementById('search-input').value;
  const sortValue = document.getElementById('sort-by').value;
  const url = new URL(window.location.href);
  
  if (searchValue) url.searchParams.set('search', searchValue);
  else url.searchParams.delete('search');
  
  window.location.href = url.toString();
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  setTimeout(() => toast.hidden = true, 4000);
}
