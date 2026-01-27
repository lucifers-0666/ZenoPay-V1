// Statements JavaScript

const viewStatementButtons = document.querySelectorAll('.view-statement-btn');
const downloadPdfButtons = document.querySelectorAll('.download-pdf-btn');
const downloadCsvButtons = document.querySelectorAll('.download-csv-btn');
const statementModal = document.getElementById('statement-modal');
const closeModalBtn = document.getElementById('close-modal');
const statementDetailContent = document.getElementById('statement-detail-content');
const modalStatementTitle = document.getElementById('modal-statement-title');

// View statement details
viewStatementButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const month = btn.dataset.month;
    const year = btn.dataset.year;
    statementModal.hidden = false;
    modalStatementTitle.textContent = `Statement - ${getMonthName(month)} ${year}`;
    
    try {
      const response = await fetch(`/statements/${month}/${year}`);
      const data = await response.json();
      
      if (data.success) {
        displayStatementDetail(data.statement);
      }
    } catch (error) {
      console.error('Error loading statement:', error);
      showToast('Failed to load statement', 'error');
    }
  });
});

function displayStatementDetail(statement) {
  const content = `
    <div class="statement-detail">
      <div class="summary-box">
        <h3>Summary</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span>Opening Balance</span>
            <strong>$${statement.openingBalance.toFixed(2)}</strong>
          </div>
          <div class="summary-item">
            <span>Total Credits</span>
            <strong class="positive">+$${statement.totalReceived.toFixed(2)}</strong>
          </div>
          <div class="summary-item">
            <span>Total Debits</span>
            <strong class="negative">-$${statement.totalSent.toFixed(2)}</strong>
          </div>
          <div class="summary-item">
            <span>Total Fees</span>
            <strong>-$${statement.totalFees.toFixed(2)}</strong>
          </div>
          <div class="summary-item highlight">
            <span>Closing Balance</span>
            <strong>$${statement.closingBalance.toFixed(2)}</strong>
          </div>
        </div>
      </div>
      
      ${statement.insights ? `
        <div class="insights-box">
          <h3>Insights</h3>
          <ul>
            <li>You spent ${Math.abs(statement.insights.spendingChange)}% ${statement.insights.spendingChange < 0 ? 'less' : 'more'} this month</li>
            <li>Top spending category: ${statement.insights.topCategory}</li>
            <li>Highest single transaction: $${statement.insights.highestTransaction.toFixed(2)}</li>
          </ul>
        </div>
      ` : ''}
      
      ${statement.chartData ? `
        <div class="charts-section">
          <h3>Spending by Category</h3>
          <canvas id="category-chart"></canvas>
        </div>
      ` : ''}
      
      <div class="actions-box">
        <button class="btn btn-primary" onclick="downloadPDF('${statement.period.month}', '${statement.period.year}')">
          <i class="fas fa-file-pdf"></i> Download PDF
        </button>
        <button class="btn btn-secondary" onclick="downloadCSV('${statement.period.month}', '${statement.period.year}')">
          <i class="fas fa-file-csv"></i> Download CSV
        </button>
        <button class="btn btn-secondary" onclick="emailStatement('${statement.period.month}', '${statement.period.year}')">
          <i class="fas fa-envelope"></i> Email Statement
        </button>
      </div>
    </div>
  `;
  
  statementDetailContent.innerHTML = content;
  
  // Render chart if data available
  if (statement.chartData) {
    renderCategoryChart(statement.chartData.categoryBreakdown);
  }
}

function renderCategoryChart(data) {
  const canvas = document.getElementById('category-chart');
  if (!canvas) return;
  
  new Chart(canvas, {
    type: 'pie',
    data: {
      labels: data.map(d => d.category),
      datasets: [{
        data: data.map(d => d.amount),
        backgroundColor: ['#6c5ce7', '#00d084', '#ff6b6b', '#ffd700', '#a3a9c2']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// Download PDF
downloadPdfButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const month = btn.dataset.month;
    const year = btn.dataset.year;
    downloadPDF(month, year);
  });
});

async function downloadPDF(month, year) {
  try {
    const response = await fetch(`/statements/${month}/${year}/download-pdf`);
    const data = await response.json();
    if (data.success) {
      showToast('PDF download started', 'success');
      // window.open(data.downloadUrl, '_blank');
    }
  } catch (error) {
    showToast('Failed to download PDF', 'error');
  }
}

// Download CSV
downloadCsvButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const month = btn.dataset.month;
    const year = btn.dataset.year;
    downloadCSV(month, year);
  });
});

async function downloadCSV(month, year) {
  try {
    const response = await fetch(`/statements/${month}/${year}/download-csv`);
    const data = await response.json();
    if (data.success) {
      showToast('CSV download started', 'success');
    }
  } catch (error) {
    showToast('Failed to download CSV', 'error');
  }
}

// Email statement
async function emailStatement(month, year) {
  const email = prompt('Enter email address:');
  if (!email) return;
  
  try {
    const response = await fetch(`/statements/${month}/${year}/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    if (data.success) {
      showToast('Statement emailed successfully', 'success');
    }
  } catch (error) {
    showToast('Failed to email statement', 'error');
  }
}

// Close modal
closeModalBtn?.addEventListener('click', () => {
  statementModal.hidden = true;
});

statementModal?.addEventListener('click', (e) => {
  if (e.target === statementModal) {
    statementModal.hidden = true;
  }
});

function getMonthName(month) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[parseInt(month) - 1];
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  setTimeout(() => toast.hidden = true, 4000);
}
