// Analytics Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard().catch(() => {
        showToast('Failed to load analytics data', 'error');
    });
});

async function initializeDashboard() {
    const response = await fetch('/admin/analytics/chart-data', {
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
        throw new Error('Unable to fetch chart data');
    }

    const payload = await response.json();
    if (!payload?.success) {
        throw new Error(payload?.message || 'Chart data request failed');
    }

    loadMetrics(payload);
    initializeCharts(payload);
}

function loadMetrics(payload) {
    const dailyVolumeData = payload?.dailyTransactionVolume?.datasets?.[0]?.data || [];
    const typeData = payload?.transactionTypeBreakdown?.datasets?.[0]?.data || [];
    const weeklyUsers = payload?.weeklyUserRegistrations?.datasets?.[0]?.data || [];

    const totalRevenue = dailyVolumeData.reduce((sum, val) => sum + Number(val || 0), 0);
    const txnVolume = typeData.reduce((sum, val) => sum + Number(val || 0), 0);
    const activeMerchants = weeklyUsers.reduce((sum, val) => sum + Number(val || 0), 0);

    const totalRevenueNode = document.getElementById('totalRevenue');
    const txnVolumeNode = document.getElementById('txnVolume');
    const activeMerchantsNode = document.getElementById('activeMerchants');
    const successRateNode = document.getElementById('successRate');

    if (totalRevenueNode) totalRevenueNode.textContent = formatCurrency(totalRevenue);
    if (txnVolumeNode) txnVolumeNode.textContent = txnVolume.toLocaleString('en-IN');
    if (activeMerchantsNode) activeMerchantsNode.textContent = activeMerchants.toLocaleString('en-IN');
    if (successRateNode) successRateNode.textContent = '100%';
}

function initializeCharts(payload) {
    if (typeof Chart === 'undefined') return;

    const dailyTransactionVolume = payload?.dailyTransactionVolume || { labels: [], datasets: [{ data: [] }] };
    const transactionTypeBreakdown = payload?.transactionTypeBreakdown || { labels: [], datasets: [{ data: [] }] };
    const weeklyUserRegistrations = payload?.weeklyUserRegistrations || { labels: [], datasets: [{ data: [] }] };

    // Revenue Trend Chart
    new Chart(document.getElementById('revenueChart'), {
        type: 'line',
        data: {
            labels: dailyTransactionVolume.labels,
            datasets: [{
                label: 'Revenue',
                data: dailyTransactionVolume.datasets[0].data,
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
            labels: weeklyUserRegistrations.labels,
            datasets: [{
                label: 'New Users',
                data: weeklyUserRegistrations.datasets[0].data,
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
            labels: transactionTypeBreakdown.labels,
            datasets: [{
                data: transactionTypeBreakdown.datasets[0].data,
                backgroundColor: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

async function updateAllCharts() {
    showToast('Refreshing charts...', 'info');
    await initializeDashboard();
    showToast('Charts refreshed', 'success');
}
function toggleChartView(chart) { showToast(`Toggling ${chart} chart view...`, 'info'); }
function viewAllMerchants() { window.location.href = '/admin/merchants'; }
function viewAllActivity() { window.location.href = '/admin/activity-log'; }
function exportReport(format = 'csv') {
    window.location.href = `/admin/reports/export?range=30&format=${encodeURIComponent(format)}`;
}

function formatCurrency(amount) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount); }
function showToast(message, type = 'success') { const toast = document.createElement('div'); toast.className = `toast toast-${type}`; toast.textContent = message; document.body.appendChild(toast); setTimeout(() => toast.classList.add('show'), 100); setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000); }
