// Statements Page JavaScript
// Global state
let currentPage = 1;
let currentFilters = {
  year: '',
  month: '',
  status: ''
};
let currentView = 'grid';
let allStatements = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeYearDropdowns();
  loadStatements();
});

// Initialize year dropdowns with last 5 years
function initializeYearDropdowns() {
  const currentYear = new Date().getFullYear();
  const years = [];
  
  for (let i = 0; i < 5; i++) {
    years.push(currentYear - i);
  }

  // Filter year dropdown
  const filterYearSelect = document.getElementById('filter-year');
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    filterYearSelect.appendChild(option);
  });

  // Generate year dropdown
  const genYearSelect = document.getElementById('gen-year');
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    if (year === currentYear) {
      option.selected = true;
    }
    genYearSelect.appendChild(option);
  });
}

// Load statements from API
async function loadStatements(page = 1) {
  showLoading();
  
  try {
    const params = new URLSearchParams({
      page,
      limit: 10,
      ...currentFilters
    });

    const response = await fetch(`/api/statements?${params}`);
    const data = await response.json();

    if (data.success) {
      allStatements = data.statements;
      renderStatements(data.statements);
      renderPagination(data.pagination);
      hideLoading();
      
      if (data.statements.length === 0) {
        showEmptyState();
      }
    } else {
      showToast(data.message || 'Failed to load statements', 'error');
      hideLoading();
    }
  } catch (error) {
    console.error('Error loading statements:', error);
    showToast('Failed to load statements', 'error');
    hideLoading();
  }
}

// Render statements in grid or list view
function renderStatements(statements) {
  if (currentView === 'grid') {
    renderGridView(statements);
  } else {
    renderListView(statements);
  }
}

// Render grid view
function renderGridView(statements) {
  const grid = document.getElementById('statements-grid');
  grid.innerHTML = '';
  grid.style.display = 'grid';
  document.getElementById('statements-list').style.display = 'none';

  statements.forEach(statement => {
    const card = createStatementCard(statement);
    grid.appendChild(card);
  });
}

// Create statement card for grid view
function createStatementCard(statement) {
  const card = document.createElement('div');
  card.className = 'statement-card';
  
  const periodStart = new Date(statement.period.start).toLocaleDateString();
  const periodEnd = new Date(statement.period.end).toLocaleDateString();
  
  const netAmount = statement.total_received - statement.total_sent - statement.fees;
  const netClass = netAmount >= 0 ? 'positive' : 'negative';
  
  card.innerHTML = `
    <div class="statement-header">
      <div class="statement-period">
        <i class="fas fa-calendar-alt"></i>
        <h3>${statement.statement_month}</h3>
      </div>
      <span class="statement-badge ${statement.status}">${statement.status}</span>
    </div>
    
    <div class="statement-date-range">
      ${periodStart} - ${periodEnd}
    </div>
    
    <div class="statement-summary">
      <div class="summary-item">
        <span class="label">Total Sent</span>
        <span class="value negative">-$${statement.total_sent.toFixed(2)}</span>
      </div>
      <div class="summary-item">
        <span class="label">Total Received</span>
        <span class="value positive">+$${statement.total_received.toFixed(2)}</span>
      </div>
      <div class="summary-item">
        <span class="label">Fees</span>
        <span class="value">$${statement.fees.toFixed(2)}</span>
      </div>
      <div class="summary-item">
        <span class="label">Transactions</span>
        <span class="value">${statement.total_transactions}</span>
      </div>
    </div>
    
    <div class="statement-actions">
      <button class="btn btn-secondary" onclick="viewStatement('${statement.id}')">
        <i class="fas fa-eye"></i> View
      </button>
      ${statement.status === 'ready' ? `
        <button class="btn btn-primary" onclick="downloadStatement('${statement.id}')">
          <i class="fas fa-download"></i> Download
        </button>
      ` : `
        <button class="btn btn-secondary" disabled>
          <i class="fas fa-spinner fa-spin"></i> Processing
        </button>
      `}
    </div>
  `;
  
  return card;
}

// Render list view
function renderListView(statements) {
  const list = document.getElementById('statements-list');
  const tbody = document.getElementById('statements-table-body');
  
  list.style.display = 'block';
  document.getElementById('statements-grid').style.display = 'none';
  
  tbody.innerHTML = '';
  
  statements.forEach(statement => {
    const row = createStatementRow(statement);
    tbody.appendChild(row);
  });
}

// Create statement row for list view
function createStatementRow(statement) {
  const row = document.createElement('tr');
  
  const periodStart = new Date(statement.period.start).toLocaleDateString();
  const periodEnd = new Date(statement.period.end).toLocaleDateString();
  
  row.innerHTML = `
    <td><strong>${statement.statement_month}</strong></td>
    <td>${periodStart} - ${periodEnd}</td>
    <td>${statement.total_transactions}</td>
    <td class="negative">$${statement.total_sent.toFixed(2)}</td>
    <td class="positive">$${statement.total_received.toFixed(2)}</td>
    <td>$${statement.fees.toFixed(2)}</td>
    <td><span class="statement-badge ${statement.status}">${statement.status}</span></td>
    <td>
      <button class="btn btn-icon btn-secondary" onclick="viewStatement('${statement.id}')" title="View">
        <i class="fas fa-eye"></i>
      </button>
      ${statement.status === 'ready' ? `
        <button class="btn btn-icon btn-primary" onclick="downloadStatement('${statement.id}')" title="Download">
          <i class="fas fa-download"></i>
        </button>
      ` : ''}
    </td>
  `;
  
  return row;
}

// Switch between grid and list view
function switchView(view) {
  currentView = view;
  
  document.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  document.querySelector(`[data-view="${view}"]`).classList.add('active');
  
  renderStatements(allStatements);
}

// Apply filters
function applyFilters() {
  currentFilters.year = document.getElementById('filter-year').value;
  currentFilters.month = document.getElementById('filter-month').value;
  currentFilters.status = document.getElementById('filter-status').value;
  
  currentPage = 1;
  loadStatements(currentPage);
}

// Reset filters
function resetFilters() {
  document.getElementById('filter-year').value = '';
  document.getElementById('filter-month').value = '';
  document.getElementById('filter-status').value = '';
  
  currentFilters = {
    year: '',
    month: '',
    status: ''
  };
  
  currentPage = 1;
  loadStatements(currentPage);
}

// Render pagination
function renderPagination(pagination) {
  const container = document.getElementById('pagination');
  container.innerHTML = '';
  
  if (pagination.pages <= 1) return;
  
  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = pagination.page === 1;
  prevBtn.onclick = () => loadStatements(pagination.page - 1);
  container.appendChild(prevBtn);
  
  // Page numbers
  for (let i = 1; i <= pagination.pages; i++) {
    if (i === 1 || i === pagination.pages || (i >= pagination.page - 2 && i <= pagination.page + 2)) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.className = i === pagination.page ? 'active' : '';
      pageBtn.onclick = () => loadStatements(i);
      container.appendChild(pageBtn);
    } else if (i === pagination.page - 3 || i === pagination.page + 3) {
      const ellipsis = document.createElement('span');
      ellipsis.textContent = '...';
      ellipsis.style.padding = '0.5rem';
      container.appendChild(ellipsis);
    }
  }
  
  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = pagination.page === pagination.pages;
  nextBtn.onclick = () => loadStatements(pagination.page + 1);
  container.appendChild(nextBtn);
}

// Open generate statement modal
function openGenerateModal() {
  document.getElementById('generate-modal').classList.add('active');
  
  // Set default month to current month
  const currentMonth = new Date().getMonth() + 1;
  document.getElementById('gen-month').value = currentMonth;
}

// Close generate statement modal
function closeGenerateModal() {
  document.getElementById('generate-modal').classList.remove('active');
  document.getElementById('generate-form').reset();
}

// Toggle period type in generate modal
function togglePeriodType() {
  const periodType = document.querySelector('input[name="period-type"]:checked').value;
  const monthlyPeriod = document.getElementById('monthly-period');
  const customPeriod = document.getElementById('custom-period');
  
  if (periodType === 'monthly') {
    monthlyPeriod.style.display = 'block';
    customPeriod.style.display = 'none';
    document.getElementById('gen-month').required = true;
    document.getElementById('gen-year').required = true;
    document.getElementById('gen-start-date').required = false;
    document.getElementById('gen-end-date').required = false;
  } else {
    monthlyPeriod.style.display = 'none';
    customPeriod.style.display = 'block';
    document.getElementById('gen-month').required = false;
    document.getElementById('gen-year').required = false;
    document.getElementById('gen-start-date').required = true;
    document.getElementById('gen-end-date').required = true;
  }
}

// Generate statement
async function generateStatement(event) {
  event.preventDefault();
  
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
  
  try {
    const periodType = document.querySelector('input[name="period-type"]:checked').value;
    const body = {};
    
    if (periodType === 'monthly') {
      body.month = document.getElementById('gen-month').value;
      body.year = document.getElementById('gen-year').value;
    } else {
      body.start_date = document.getElementById('gen-start-date').value;
      body.end_date = document.getElementById('gen-end-date').value;
    }
    
    const response = await fetch('/api/statements/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('Statement generation started. You will be notified when it\'s ready.', 'success');
      closeGenerateModal();
      
      // Reload statements after 2 seconds
      setTimeout(() => {
        loadStatements(currentPage);
      }, 2000);
    } else {
      showToast(data.message || 'Failed to generate statement', 'error');
    }
  } catch (error) {
    console.error('Error generating statement:', error);
    showToast('Failed to generate statement', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// View statement details
async function viewStatement(statementId) {
  const modal = document.getElementById('detail-modal');
  const title = document.getElementById('detail-title');
  const content = document.getElementById('detail-content');
  
  modal.classList.add('active');
  title.textContent = 'Loading...';
  content.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
  
  try {
    const response = await fetch(`/api/statements/${statementId}`);
    const data = await response.json();
    
    if (data.success) {
      const statement = data.statement;
      title.textContent = statement.statement_month;
      content.innerHTML = renderStatementDetail(statement);
    } else {
      showToast(data.message || 'Failed to load statement details', 'error');
      closeDetailModal();
    }
  } catch (error) {
    console.error('Error loading statement details:', error);
    showToast('Failed to load statement details', 'error');
    closeDetailModal();
  }
}

// Render statement detail content
function renderStatementDetail(statement) {
  const netAmount = statement.total_received - statement.total_sent - statement.fees;
  const netClass = netAmount >= 0 ? 'positive' : 'negative';
  
  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      <div style="padding: 1rem; background: #f7fafc; border-radius: 12px;">
        <div style="font-size: 0.875rem; color: #718096;">Opening Balance</div>
        <div style="font-size: 1.5rem; font-weight: 700; color: #1a202c;">$${statement.opening_balance.toFixed(2)}</div>
      </div>
      <div style="padding: 1rem; background: #f7fafc; border-radius: 12px;">
        <div style="font-size: 0.875rem; color: #718096;">Total Transactions</div>
        <div style="font-size: 1.5rem; font-weight: 700; color: #1a202c;">${statement.total_transactions}</div>
      </div>
      <div style="padding: 1rem; background: #f7fafc; border-radius: 12px;">
        <div style="font-size: 0.875rem; color: #718096;">Net Change</div>
        <div style="font-size: 1.5rem; font-weight: 700;" class="${netClass}">
          ${netAmount >= 0 ? '+' : ''}$${netAmount.toFixed(2)}
        </div>
      </div>
      <div style="padding: 1rem; background: #f7fafc; border-radius: 12px;">
        <div style="font-size: 0.875rem; color: #718096;">Closing Balance</div>
        <div style="font-size: 1.5rem; font-weight: 700; color: #1a202c;">$${statement.closing_balance.toFixed(2)}</div>
      </div>
    </div>
    
    <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
      ${statement.pdf_url ? `
        <button class="btn btn-primary" onclick="downloadStatement('${statement._id}')">
          <i class="fas fa-download"></i> Download PDF
        </button>
        <button class="btn btn-secondary" onclick="emailStatement('${statement._id}')">
          <i class="fas fa-envelope"></i> Email Statement
        </button>
      ` : ''}
    </div>
    
    <h3 style="margin-bottom: 1rem;">Recent Transactions</h3>
    <div style="max-height: 400px; overflow-y: auto;">
      ${statement.transactions.slice(0, 10).map(txn => `
        <div style="padding: 1rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
          <div>
            <div style="font-weight: 600;">${txn.description}</div>
            <div style="font-size: 0.875rem; color: #718096;">${new Date(txn.date).toLocaleDateString()}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700;" class="${txn.type === 'sent' ? 'negative' : 'positive'}">
              ${txn.type === 'sent' ? '-' : '+'}$${Math.abs(txn.amount).toFixed(2)}
            </div>
            ${txn.fee > 0 ? `<div style="font-size: 0.875rem; color: #718096;">Fee: $${txn.fee.toFixed(2)}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
    ${statement.transactions.length > 10 ? `<p style="text-align: center; margin-top: 1rem; color: #718096;">And ${statement.transactions.length - 10} more transactions...</p>` : ''}
  `;
}

// Close detail modal
function closeDetailModal() {
  document.getElementById('detail-modal').classList.remove('active');
}

// Download statement
async function downloadStatement(statementId) {
  try {
    const response = await fetch(`/api/statements/${statementId}/download`);
    const data = await response.json();
    
    if (data.success) {
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = data.download_url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('Statement downloaded successfully', 'success');
    } else {
      showToast(data.message || 'Failed to download statement', 'error');
    }
  } catch (error) {
    console.error('Error downloading statement:', error);
    showToast('Failed to download statement', 'error');
  }
}

// Email statement
async function emailStatement(statementId) {
  try {
    const response = await fetch(`/api/statements/${statementId}/email`, {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast(data.message, 'success');
    } else {
      showToast(data.message || 'Failed to email statement', 'error');
    }
  } catch (error) {
    console.error('Error emailing statement:', error);
    showToast('Failed to email statement', 'error');
  }
}

// Download all statements
async function downloadAllStatements() {
  showToast('Preparing download...', 'success');
  // TODO: Implement bulk download
  // This would require a backend endpoint to create a ZIP file
  console.log('Download all statements');
}

// Show loading state
function showLoading() {
  document.getElementById('loading-state').style.display = 'flex';
  document.getElementById('statements-grid').style.display = 'none';
  document.getElementById('statements-list').style.display = 'none';
  document.getElementById('empty-state').style.display = 'none';
}

// Hide loading state
function hideLoading() {
  document.getElementById('loading-state').style.display = 'none';
}

// Show empty state
function showEmptyState() {
  document.getElementById('empty-state').style.display = 'block';
  document.getElementById('statements-grid').style.display = 'none';
  document.getElementById('statements-list').style.display = 'none';
}

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Sort statements (for list view)
function sortBy(column) {
  // TODO: Implement sorting
  console.log('Sort by:', column);
}

// Close modals when clicking outside
document.addEventListener('click', function(event) {
  const generateModal = document.getElementById('generate-modal');
  const detailModal = document.getElementById('detail-modal');
  
  if (event.target === generateModal) {
    closeGenerateModal();
  }
  
  if (event.target === detailModal) {
    closeDetailModal();
  }
});
