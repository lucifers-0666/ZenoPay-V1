// Banks List Page
let banksData = [
    { id: 'BNK-001', name: 'HDFC Bank', ifscPrefix: 'HDFC', type: 'private', status: 'active', merchants: 245, volume: 125600000, logo: '/Images/banks/hdfc.png' },
    { id: 'BNK-002', name: 'ICICI Bank', ifscPrefix: 'ICIC', type: 'private', status: 'active', merchants: 198, volume: 98450000, logo: '/Images/banks/icici.png' },
    { id: 'BNK-003', name: 'State Bank of India', ifscPrefix: 'SBIN', type: 'public', status: 'active', merchants: 456, volume: 234500000, logo: '/Images/banks/sbi.png' },
    { id: 'BNK-004', name: 'Axis Bank', ifscPrefix: 'UTIB', type: 'private', status: 'active', merchants: 167, volume: 87600000, logo: '/Images/banks/axis.png' },
    { id: 'BNK-005', name: 'Kotak Mahindra Bank', ifscPrefix: 'KKBK', type: 'private', status: 'active', merchants: 134, volume: 65400000, logo: '/Images/banks/kotak.png' },
    { id: 'BNK-006', name: 'Punjab National Bank', ifscPrefix: 'PUNB', type: 'public', status: 'active', merchants: 289, volume: 145800000, logo: '/Images/banks/pnb.png' },
    { id: 'BNK-007', name: 'IndusInd Bank', ifscPrefix: 'INDB', type: 'private', status: 'inactive', merchants: 45, volume: 12300000, logo: '/Images/banks/indusind.png' },
    { id: 'BNK-008', name: 'Yes Bank', ifscPrefix: 'YESB', type: 'private', status: 'active', merchants: 78, volume: 34500000, logo: '/Images/banks/yes.png' },
    { id: 'BNK-009', name: 'Bank of Baroda', ifscPrefix: 'BARB', type: 'public', status: 'active', merchants: 156, volume: 76800000, logo: '/Images/banks/bob.png' },
    { id: 'BNK-010', name: 'Canara Bank', ifscPrefix: 'CNRB', type: 'public', status: 'pending', merchants: 0, volume: 0, logo: '/Images/banks/canara.png' }
];

let filteredData = [...banksData];
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
    document.getElementById('typeFilter').addEventListener('change', applyFilters);
});

function updateStats() {
    document.getElementById('totalBanks').textContent = banksData.length;
    document.getElementById('activeBanks').textContent = banksData.filter(b => b.status === 'active').length;
    document.getElementById('pendingBanks').textContent = banksData.filter(b => b.status === 'pending').length;
    document.getElementById('inactiveBanks').textContent = banksData.filter(b => b.status === 'inactive').length;
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;

    filteredData = banksData.filter(bank => {
        const matchesSearch = !searchTerm || bank.name.toLowerCase().includes(searchTerm) || bank.ifscPrefix.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || bank.status === statusFilter;
        const matchesType = !typeFilter || bank.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    currentPage = 1;
    renderTable();
}

function renderTable() {
    const tbody = document.getElementById('banksTableBody');
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

    tbody.innerHTML = pageData.map(bank => `
        <tr>
            <td>
                <div class="merchant-cell">
                    <img src="${bank.logo}" alt="${bank.name}" class="merchant-logo" onerror="this.src='/Images/default-bank.png'">
                    <div class="merchant-info">
                        <div class="merchant-name">${bank.name}</div>
                    </div>
                </div>
            </td>
            <td><code>${bank.ifscPrefix}</code></td>
            <td><span class="text-capitalize">${bank.type} Sector</span></td>
            <td><span class="badge-${bank.status === 'active' ? 'success' : bank.status === 'pending' ? 'warning' : 'error'}">${bank.status}</span></td>
            <td><strong>${bank.merchants}</strong> merchants</td>
            <td><strong>${formatCurrency(bank.volume)}</strong></td>
            <td style="text-align: center;">
                <div class="action-buttons">
                    <button class="btn-icon-primary" onclick="viewBank('${bank.id}')" title="View"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>
                    <button class="btn-icon-secondary" onclick="editBank('${bank.id}')" title="Edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>
                    <button class="btn-icon-${bank.status === 'active' ? 'danger' : 'success'}" onclick="toggleStatus('${bank.id}')" title="${bank.status === 'active' ? 'Deactivate' : 'Activate'}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${bank.status === 'active' ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>' : '<polyline points="20 6 9 17 4 12"></polyline>'}</svg></button>
                </div>
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
function clearFilters() { document.getElementById('searchInput').value = ''; document.getElementById('statusFilter').value = ''; document.getElementById('typeFilter').value = ''; applyFilters(); }

function viewBank(id) { window.location.href = '/admin/banks/details?id=' + id; }
function editBank(id) { window.location.href = '/admin/banks/edit?id=' + id; }
function toggleStatus(id) { if(confirm('Toggle bank status?')) { showToast('Bank status updated', 'success'); setTimeout(() => location.reload(), 1000); } }
function addNewBank() { window.location.href = '/admin/banks/add'; }
function exportBanks() { showToast('Exporting banks...', 'info'); }

function formatCurrency(amount) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount); }
function showToast(message, type = 'success') { const toast = document.createElement('div'); toast.className = `toast toast-${type}`; toast.textContent = message; document.body.appendChild(toast); setTimeout(() => toast.classList.add('show'), 100); setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000); }
