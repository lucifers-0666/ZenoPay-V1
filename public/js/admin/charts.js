/**
 * Admin Charts JavaScript
 * Handles Chart.js initialization for dashboard charts
 */

document.addEventListener('DOMContentLoaded', function() {
  initCharts();
});

function initCharts() {
  
  // Transaction Chart (Line Chart)
  const transactionCtx = document.getElementById('transactionChart');
  if (transactionCtx) {
    new Chart(transactionCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Transactions',
          data: [450, 520, 480, 610, 590, 720, 680],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#3B82F6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: false 
          },
          tooltip: {
            backgroundColor: '#1e293b',
            padding: 12,
            borderRadius: 8,
            titleFont: {
              size: 14,
              weight: 600
            },
            bodyFont: {
              size: 13
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#f1f5f9',
              borderDash: [5, 5]
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 12
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#64748b',
              font: {
                size: 12
              }
            }
          }
        }
      }
    });
  }
  
  // Revenue Chart (Doughnut Chart)
  const revenueCtx = document.getElementById('revenueChart');
  if (revenueCtx) {
    new Chart(revenueCtx, {
      type: 'doughnut',
      data: {
        labels: ['Online', 'Offline'],
        datasets: [{
          data: [65, 35],
          backgroundColor: ['#3B82F6', '#8B5CF6'],
          borderWidth: 0,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: false 
          },
          tooltip: {
            backgroundColor: '#1e293b',
            padding: 12,
            borderRadius: 8,
            titleFont: {
              size: 14,
              weight: 600
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: function(context) {
                return context.label + ': ' + context.parsed + '%';
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  }
  
}

/**
 * Update chart data dynamically
 */
function updateChartData(chartId, newData) {
  const chart = Chart.getChart(chartId);
  if (chart) {
    chart.data.datasets[0].data = newData;
    chart.update();
  }
}

/**
 * Handle chart filter change
 */
const chartFilters = document.querySelectorAll('.chart-filter');
chartFilters.forEach(filter => {
  filter.addEventListener('change', function() {
    const period = this.value;
    console.log('Loading data for period:', period);
    // TODO: Fetch and update chart data based on selected period
  });
});


/**
 * Create bar chart
 */
function createBarChart(canvasId, data, label) {
  // TODO: Implement using Chart.js
  console.log('Creating bar chart:', label);
}

/**
 * Create line chart
 */
function createLineChart(canvasId, data, label) {
  // TODO: Implement using Chart.js
  console.log('Creating line chart:', label);
}

/**
 * Create pie chart
 */
function createPieChart(canvasId, data, label) {
  // TODO: Implement using Chart.js
  console.log('Creating pie chart:', label);
}

/**
 * Refresh chart data
 */
function refreshChartData(chartId) {
  // TODO: Implement chart data refresh
  console.log('Refreshing chart:', chartId);
}
