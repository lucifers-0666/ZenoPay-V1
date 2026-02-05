/**
 * Statistics Page JavaScript
 * Handles charts, filters, and data visualization
 */

let transactionsDayChart = null;
let channelBreakdownChart = null;
let failureReasonsChart = null;

document.addEventListener('DOMContentLoaded', function() {
  initCharts();
  initFilters();
  initExport();
});

/**
 * Initialize all charts
 */
function initCharts() {
  initTransactionsDayChart();
  initChannelBreakdownChart();
  initFailureReasonsChart();
}

/**
 * Initialize Transactions by Day chart (Line Chart)
 */
function initTransactionsDayChart() {
  const ctx = document.getElementById('transactionsDayChart');
  if (!ctx) return;

  // Sample data for 30 days
  const labels = [];
  const totalData = [];
  const successData = [];
  
  // Generate 30 days of data
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    // Random data for demo
    const total = Math.floor(Math.random() * 1000) + 2000;
    const success = Math.floor(total * (0.95 + Math.random() * 0.05));
    totalData.push(total);
    successData.push(success);
  }

  transactionsDayChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Total Transactions',
          data: totalData,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Successful',
          data: successData,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12,
              weight: '600'
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 13,
            weight: '600'
          },
          bodyFont: {
            size: 12
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11
            },
            maxRotation: 45,
            minRotation: 0
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#f1f5f9'
          },
          ticks: {
            font: {
              size: 11
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });
}

/**
 * Initialize Channel Breakdown chart (Doughnut Chart)
 */
function initChannelBreakdownChart() {
  const ctx = document.getElementById('channelBreakdownChart');
  if (!ctx) return;

  channelBreakdownChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Web', 'Mobile App', 'API', 'Other'],
      datasets: [{
        data: [42.5, 31.8, 20.4, 5.3],
        backgroundColor: [
          '#3B82F6', // Blue
          '#8B5CF6', // Purple
          '#06B6D4', // Cyan
          '#F59E0B'  // Amber
        ],
        borderWidth: 0,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 13,
            weight: '600'
          },
          bodyFont: {
            size: 12
          },
          callbacks: {
            label: function(context) {
              return context.label + ': ' + context.parsed + '%';
            }
          }
        }
      }
    }
  });
}

/**
 * Initialize Failure Reasons chart (Horizontal Bar Chart)
 */
function initFailureReasonsChart() {
  const ctx = document.getElementById('failureReasonsChart');
  if (!ctx) return;

  failureReasonsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Network Issues', 'Auth Failed', 'Insufficient Funds', 'Card Declined', 'Timeout', 'Other'],
      datasets: [{
        label: 'Failed Transactions',
        data: [245, 198, 167, 143, 89, 52],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(100, 116, 139, 0.8)'
        ],
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 13,
            weight: '600'
          },
          bodyFont: {
            size: 12
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: '#f1f5f9'
          },
          ticks: {
            font: {
              size: 11
            }
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11
            }
          }
        }
      }
    }
  });
}

/**
 * Initialize filter interactions
 */
function initFilters() {
  // Tab filtering
  const filterTabs = document.querySelectorAll('.filter-tab');
  filterTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      filterTabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Get selected tab
      const selectedTab = this.dataset.tab;
      console.log('Selected tab:', selectedTab);
      
      // TODO: Fetch and update data based on selected tab
      // updateDashboardData(selectedTab);
    });
  });

  // Date range filter
  const dateRangeFilter = document.getElementById('dateRange');
  if (dateRangeFilter) {
    dateRangeFilter.addEventListener('change', function() {
      const range = this.value;
      console.log('Date range changed:', range);
      
      // TODO: Fetch and update data based on date range
      // updateChartsByDateRange(range);
    });
  }

  // Status filter
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', function() {
      const status = this.value;
      console.log('Status filter changed:', status);
      
      // TODO: Fetch and update data based on status
      // updateDataByStatus(status);
    });
  }

  // Transaction chart filter
  const transactionChartFilter = document.getElementById('transactionChartFilter');
  if (transactionChartFilter) {
    transactionChartFilter.addEventListener('change', function() {
      const days = parseInt(this.value);
      console.log('Transaction chart filter changed:', days);
      
      // TODO: Update transaction chart with new date range
      // updateTransactionChart(days);
    });
  }
}

/**
 * Initialize export functionality
 */
function initExport() {
  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      console.log('Export button clicked');
      
      // TODO: Implement export functionality
      // This could export to CSV, PDF, or Excel
      alert('Export functionality will be implemented soon.');
      
      // Example implementation:
      // const currentTab = document.querySelector('.filter-tab.active').dataset.tab;
      // const dateRange = document.getElementById('dateRange').value;
      // const status = document.getElementById('statusFilter').value;
      // exportData(currentTab, dateRange, status);
    });
  }
}

/**
 * Update chart data (placeholder function)
 */
function updateChartData(chartId, newData) {
  // This function would be used to dynamically update charts
  // when filters change or new data is fetched from the server
  console.log('Updating chart:', chartId, newData);
}

/**
 * Destroy all charts (useful for cleanup)
 */
function destroyCharts() {
  if (transactionsDayChart) {
    transactionsDayChart.destroy();
    transactionsDayChart = null;
  }
  if (channelBreakdownChart) {
    channelBreakdownChart.destroy();
    channelBreakdownChart = null;
  }
  if (failureReasonsChart) {
    failureReasonsChart.destroy();
    failureReasonsChart = null;
  }
}
