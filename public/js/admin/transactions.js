// All Transactions Page
let transactionsData = [
    { id: 'TXN-8547', merchant: 'UrbanCart Retail', customer: 'Amit Singh', amount: 4500, method: 'upi', status: 'success', date: '2026-02-05T10:30:00' },
    { id: 'TXN-8546', merchant: 'Spice Route Kitchen', customer: 'Priya Sharma', amount: 1200, method: 'card', status: 'success', date: '2026-02-05T09:45:00' },
    { id: 'TXN-8545', merchant: 'UrbanCart Retail', customer: 'Vikram Reddy', amount: 8900, method: 'netbanking', status: 'success', date: '2026-02-05T08:20:00' },
    { id: 'TXN-8544', merchant: 'StyleHub Fashion', customer: 'Neha Kapoor', amount: 2300, method: 'upi', status: 'failed', date: '2026-02-04T18:15:00' },
    { id: 'TXN-8543', merchant: 'Green Valley Grocers', customer: 'Arjun Patel', amount: 5600, method: 'wallet', status: 'success', date: '2026-02-04T16:30:00' },
    { id: 'TXN-8542', merchant: 'FitGear Sports', customer: 'Rajesh Kumar', amount: 15600, method: 'card', status: 'success', date: '2026-02-04T14:20:00' },
    { id: 'TXN-8541', merchant: 'Café Aroma', customer: 'Anjali Desai', amount: 780, method: 'upi', status: 'success', date: '2026-02-04T12:10:00' },
    { id: 'TXN-8540', merchant: 'TechMart Electronics', customer: 'Karan Malhotra', amount: 34500, method: 'netbanking', status: 'success', date: '2026-02-04T10:45:00' },
    { id: 'TXN-8539', merchant: 'BookWorm Paradise', customer: 'Sanjay Gupta', amount: 1250, method: 'card', status: 'pending', date: '2026-02-04T09:30:00' },
    { id: 'TXN-8538', merchant: 'UrbanCart Retail', customer: 'Meera Patel', amount: 6700, method: 'upi', status: 'success', date: '2026-02-03T17:20:00' },
    { id: 'TXN-8537', merchant: 'QuickFix Services', customer: 'Rahul Verma', amount: 3400, method: 'wallet', status: 'refunded', date: '2026-02-03T15:10:00' }
];

let filteredData = [...transactionsData];
let currentPage = 1;
let pageSize = 10;

document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    renderTable();
    
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const spinner = document.getElementById('searchSpinner');
        spinner.style.display = 'block';
        searchTimeout = setTimeout(() => {
            applyFilters();
            spinner.style.display = 'none';
        }, 400);
    });

    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('methodFilter').addEventListener('change', applyFilters);
    document.getElementById('amountFilter').addEventListener('change', applyFilters);
    document.getElementById('dateFromFilter').addEventListener('change', applyFilters);
});

function updateStats() {
    document.getElementById('totalTxns').textContent = transactionsData.length;
    document.getElementById('successTxns').textContent = transactionsData.filter(t => t.status === 'success').length;
    document.getElementById('failedTxns').textContent = transactionsData.filter(t => t.status === 'failed').length;
    const totalVolume = transactionsData.filter(t => t.status === 'success').reduce((sum, t) => sum + t.amount, 0);
    document.getElementById('totalVolume').textContent = formatCurrency(totalVolume);
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const methodFilter = document.getElementById('methodFilter').value;
    const amountFilter = document.getElementById('amountFilter').value;
    const dateFrom = document.getElementById('dateFromFilter').value;

    filteredData = transactionsData.filter(txn => {
        const matchesSearch = !searchTerm || txn.id.toLowerCase().includes(searchTerm) || txn.merchant.toLowerCase().includes(searchTerm) || txn.customer.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || txn.status === statusFilter;
        const matchesMethod = !methodFilter || txn.method === methodFilter;
        const matchesDate = !dateFrom || txn.date >= dateFrom;
        
        let matchesAmount = true;
        if (amountFilter) {
            if (amountFilter === '0-1000') matchesAmount = txn.amount < 1000;
            else if (amountFilter === '1000-5000') matchesAmount = txn.amount >= 1000 && txn.amount < 5000;
            else if (amountFilter === '5000-25000') matchesAmount = txn.amount >= 5000 && txn.amount < 25000;
            else if (amountFilter === '25000+') matchesAmount = txn.amount >= 25000;
        }

        return matchesSearch && matchesStatus && matchesMethod && matchesAmount && matchesDate;
    });

    currentPage = 1;
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('transactionsTableBody');
    const emptyState = document.getElementById('emptyState');
    const paginationWrapper = document.getElementById('paginationWrapper');

    if (filteredData.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'flex';
        paginationWrapper.style.display = 'none';
        document.getElementById('resultsCount').textContent = '0';
        return;
    }

    emptyState.style.display = 'none';
    paginationWrapper.style.display = 'flex';

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filteredData.length);
    const pageData = filteredData.slice(startIndex, endIndex);

    tbody.innerHTML = pageData.map(txn => `
        <tr>
            <td><code>${txn.id}</code></td>
            <td><strong>${txn.merchant}</strong></td>
            <td>${txn.customer}</td>
            <td><strong>${formatCurrency(txn.amount)}</strong></td>
            <td><span class="text-capitalize">${txn.method}</span></td>
            <td><span class="badge-${txn.status === 'success' ? 'success' : txn.status === 'failed' ? 'error' : txn.status === 'refunded' ? 'info' : 'warning'}">${txn.status}</span></td>
            <td>${formatDateTime(txn.date)}</td>
            <td style="text-align: center;">
                <button class="btn-icon-primary" onclick="viewTransaction('${txn.id}')" title="View Details">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                </button>
            </td>
        </tr>
    `).join('');

    document.getElementById('resultsCount').textContent = filteredData.length;
    document.getElementById('showingFrom').textContent = startIndex + 1;
    document.getElementById('showingTo').textContent = endIndex;
    document.getElementById('totalRecords').textContent = filteredData.length;
    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginationControls = document.getElementById('paginationControls');
    let html = `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>`;
    paginationControls.innerHTML = html;
}

function changePage(page) { currentPage = page; renderTable(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function changePageSize() { pageSize = parseInt(document.getElementById('pageSizeSelect').value); currentPage = 1; renderTable(); }
function toggleFilters() { const panel = document.getElementById('filterPanel'); panel.style.display = panel.style.display === 'none' ? 'block' : 'none'; }
function clearFilters() { document.getElementById('searchInput').value = ''; document.getElementById('statusFilter').value = ''; document.getElementById('methodFilter').value = ''; document.getElementById('amountFilter').value = ''; document.getElementById('dateFromFilter').value = ''; applyFilters(); }
function filterByTime(range) { document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active')); event.target.classList.add('active'); }
function viewTransaction(id) { window.location.href = '/admin/transactions/details?id=' + id; }
function refreshTransactions() { showToast('Refreshing transactions...', 'info'); setTimeout(() => { showToast('Transactions updated', 'success'); }, 1000); }
function exportTransactions() { showToast('Exporting transactions...', 'info'); }

function formatCurrency(amount) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount); }
function formatDateTime(dateString) { const date = new Date(dateString); return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
function showToast(message, type = 'success') { const toast = document.createElement('div'); toast.className = `toast toast-${type}`; toast.textContent = message; document.body.appendChild(toast); setTimeout(() => toast.classList.add('show'), 100); setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000); }
