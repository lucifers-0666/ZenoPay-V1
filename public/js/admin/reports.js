// Reports Page
let previousReports = [
    {
        id: 1,
        name: 'Transaction Report - Jan 2025',
        type: 'Transaction Summary',
        generatedOn: '2025-01-14 10:30',
        period: '01 - 14 Jan 2025',
        format: 'PDF',
        size: '2.4 MB',
        status: 'completed'
    },
    {
        id: 2,
        name: 'User Activity Report',
        type: 'User Activity',
        generatedOn: '2025-01-10 15:45',
        period: 'Jan 2025',
        format: 'Excel',
        size: '1.8 MB',
        status: 'completed'
    },
    {
        id: 3,
        name: 'Merchant Performance',
        type: 'Merchant Performance',
        generatedOn: '2025-01-05 09:15',
        period: 'Dec 2024 - Jan 2025',
        format: 'PDF',
        size: '3.1 MB',
        status: 'completed'
    },
    {
        id: 4,
        name: 'Settlement Report',
        type: 'Settlement Report',
        generatedOn: '2025-01-01 23:30',
        period: 'December 2024',
        format: 'CSV',
        size: '856 KB',
        status: 'completed'
    }
];

document.addEventListener('DOMContentLoaded', function() {
    renderPreviousReports();
});

function updateReportFields() {
    const reportType = document.getElementById('reportType').value;
    const advancedFilters = document.getElementById('advancedFilters');
    
    if (reportType) {
        advancedFilters.style.display = 'block';
    } else {
        advancedFilters.style.display = 'none';
    }
}

function updateDateFields() {
    const dateRange = document.getElementById('dateRange').value;
    const customFields = document.getElementById('customDateFields');
    
    if (dateRange === 'custom') {
        customFields.style.display = 'grid';
    } else {
        customFields.style.display = 'none';
    }
}

function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const dateRange = document.getElementById('dateRange').value;
    const format = document.getElementById('reportFormat').value;

    if (!reportType || !dateRange) {
        showError('Please select report type and date range');
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Generating...';

    setTimeout(() => {
        // Add new report to list
        const reportName = `${reportType} - ${new Date().toLocaleDateString()}`;
        const newReport = {
            id: previousReports.length + 1,
            name: reportName,
            type: reportType,
            generatedOn: new Date().toLocaleString(),
            period: dateRange === 'today' ? 'Today' : dateRange,
            format: format.toUpperCase(),
            size: Math.random().toFixed(1) + ' MB',
            status: 'completed'
        };

        previousReports.unshift(newReport);
        renderPreviousReports();

        showToast(`Report generated successfully! Starting download...`, 'success');
        
        // Simulate download
        setTimeout(() => {
            downloadReport(newReport);
        }, 500);

        btn.disabled = false;
        btn.innerHTML = '+ Generate Report';
    }, 2500);
}

function renderPreviousReports() {
    const body = document.getElementById('reportsTableBody');
    if (!body) return;

    body.innerHTML = previousReports.map(report => {
        return `
            <tr>
                <td><strong>${report.name}</strong></td>
                <td>${report.type}</td>
                <td>${report.generatedOn}</td>
                <td>${report.period}</td>
                <td><code style="background: var(--slate-100); padding: 4px 8px; border-radius: 4px;">${report.format}</code></td>
                <td>${report.size}</td>
                <td><span style="background: var(--success-light); color: var(--success); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Completed</span></td>
                <td>
                    <button class="btn-icon-primary" title="Download" onclick="downloadReport(${JSON.stringify(report).replace(/"/g, '&quot;')})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function downloadReport(report) {
    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = report.name + '.' + report.format.toLowerCase();
    link.click();
    
    showToast(`Downloaded: ${report.name}`, 'success');
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
