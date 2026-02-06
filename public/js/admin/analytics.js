// Analytics Dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadMetrics();
    initializeCharts();
    loadTopMerchants();
    loadRecentActivity();
});

function loadMetrics() {
    document.getElementById('totalRevenue').textContent = formatCurrency(45678900);
    document.getElementById('txnVolume').textContent = '12,456';
    document.getElementById('activeMerchants').textContent = '342';
    document.getElementById('successRate').textContent = '98.3%';
}

function initializeCharts() {
    if (typeof Chart === 'undefined') return;

    // Revenue Trend Chart
    new Chart(document.getElementById('revenueChart'), {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Revenue',
                data: [10200000, 12500000, 11800000, 13200000],
                borderColor: 'rgb(79, 70, 229)',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Success Rate Chart
    new Chart(document.getElementById('successRateChart'), {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Success Rate (%)',
                data: [98.5, 98.7, 98.2, 98.3],
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Payment Methods Chart
    new Chart(document.getElementById('paymentMethodsChart'), {
        type: 'doughnut',
        data: {
            labels: ['UPI', 'Cards', 'Net Banking', 'Wallets'],
            datasets: [{
                data: [45, 30, 15, 10],
                backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Geographic Distribution Chart
    new Chart(document.getElementById('geoChart'), {
        type: 'bar',
        data: {
            labels: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'],
            datasets: [{
                label: 'Transactions',
                data: [3500, 2800, 2200, 1800, 1600],
                backgroundColor: 'rgba(79, 70, 229, 0.8)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Peak Hours Chart
    new Chart(document.getElementById('peakHoursChart'), {
        type: 'bar',
        data: {
            labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
            datasets: [{
                label: 'Transactions',
                data: [200, 450, 800, 650, 900, 550],
                backgroundColor: 'rgba(245, 158, 11, 0.8)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function loadTopMerchants() {
    const merchants = [
        { name: 'UrbanCart Retail', revenue: 18524000, transactions: 8547 },
        { name: 'Spice Route Kitchen', revenue: 12456000, transactions: 6234 },
        { name: 'TechMart Electronics', revenue: 9876000, transactions: 4521 },
        { name: 'Green Valley Grocers', revenue: 8765000, transactions: 5678 },
        { name: 'StyleHub Fashion', revenue: 7654000, transactions: 3456 }
    ];

    const html = merchants.map((m, i) => `
        <div class="ranking-item">
            <div class="ranking-number">${i + 1}</div>
            <div class="ranking-info">
                <div class="ranking-name">${m.name}</div>
                <div class="ranking-meta">${m.transactions} transactions</div>
            </div>
            <div class="ranking-value">${formatCurrency(m.revenue)}</div>
        </div>
    `).join('');
    document.getElementById('topMerchantsList').innerHTML = html;
}

function loadRecentActivity() {
    const activities = [
        { type: 'transaction', message: 'Large transaction of ₹50,000 from UrbanCart Retail', time: '5 mins ago' },
        { type: 'merchant', message: 'New merchant "BookWorm Paradise" approved', time: '15 mins ago' },
        { type: 'dispute', message: 'Dispute raised for transaction TXN-8544', time: '30 mins ago' },
        { type: 'settlement', message: 'Settlement of ₹2,45,600 processed', time: '1 hour ago' }
    ];

    const html = activities.map(a => `
        <div class="activity-item">
            <div class="activity-icon activity-icon-${a.type}"></div>
            <div class="activity-content">
                <div class="activity-message">${a.message}</div>
                <div class="activity-time">${a.time}</div>
            </div>
        </div>
    `).join('');
    document.getElementById('recentActivityFeed').innerHTML = html;
}

function updateAllCharts() { showToast('Updating charts...', 'info'); }
function toggleChartView(chart) { showToast(`Toggling ${chart} chart view...`, 'info'); }
function viewAllMerchants() { window.location.href = '/admin/merchants'; }
function viewAllActivity() { window.location.href = '/admin/activity-log'; }
function exportReport() { showToast('Exporting analytics report...', 'info'); }

function formatCurrency(amount) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount); }
function showToast(message, type = 'success') { const toast = document.createElement('div'); toast.className = `toast toast-${type}`; toast.textContent = message; document.body.appendChild(toast); setTimeout(() => toast.classList.add('show'), 100); setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000); }
