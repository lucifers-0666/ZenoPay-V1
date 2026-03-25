(function () {
  function initCharts() {
    // Dashboard-only chart setup
    const txCanvas = document.getElementById('transactionVolumeChart');
    const userCanvas = document.getElementById('userGrowthChart');

    if (!txCanvas && !userCanvas) return;
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js not found. admin-charts.js skipped.');
      return;
    }

    let serverCharts = window.__ADMIN_DASHBOARD_CHARTS || {};
    if (!serverCharts || !Object.keys(serverCharts).length) {
      const dataNode = document.getElementById('adminDashboardData');
      const raw = dataNode ? dataNode.getAttribute('data-charts') : '';
      if (raw) {
        try {
          serverCharts = JSON.parse(raw);
        } catch (_) {
          serverCharts = {};
        }
      }
    }
    const txSeries = serverCharts.tx || {};
    const userSeries = serverCharts.users || {};

    const fallbackLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const labelsMap = {
      '7d': txSeries['7d']?.labels || fallbackLabels,
      '30d': txSeries['30d']?.labels || fallbackLabels,
      '90d': txSeries['90d']?.labels || fallbackLabels,
    };

    const txMap = {
      '7d': txSeries['7d']?.data || Array(fallbackLabels.length).fill(0),
      '30d': txSeries['30d']?.data || Array((txSeries['30d']?.labels || fallbackLabels).length).fill(0),
      '90d': txSeries['90d']?.data || Array((txSeries['90d']?.labels || fallbackLabels).length).fill(0),
    };

    const userDefaultLabels = userSeries['7d']?.labels || labelsMap['7d'];
    const userDefaultData = userSeries['7d']?.data || Array(userDefaultLabels.length).fill(0);

    const txCtx = txCanvas ? txCanvas.getContext('2d') : null;
    const userCtx = userCanvas ? userCanvas.getContext('2d') : null;

    let txChart = null;
    let userChart = null;

    if (txCtx) {
      txChart = new Chart(txCtx, {
        type: 'line',
        data: {
          labels: labelsMap['7d'],
          datasets: [{
            label: 'Transactions',
            data: txMap['7d'],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59,130,246,0.08)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#3B82F6',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#fff',
              titleColor: '#1F2937',
              bodyColor: '#6B7280',
              borderColor: '#E2E8F0',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(226,232,240,0.6)', drawBorder: false },
              ticks: { color: '#94A3B8', font: { size: 12 } }
            },
            y: {
              grid: { color: 'rgba(226,232,240,0.6)', drawBorder: false },
              ticks: { color: '#94A3B8', font: { size: 12 } },
              beginAtZero: true
            }
          }
        }
      });
    }

    if (userCtx) {
      userChart = new Chart(userCtx, {
        type: 'bar',
        data: {
          labels: userDefaultLabels,
          datasets: [{
            label: 'New Users',
            data: userDefaultData,
            backgroundColor: 'rgba(139,92,246,0.85)',
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#fff',
              titleColor: '#1F2937',
              bodyColor: '#6B7280',
              borderColor: '#E2E8F0',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#94A3B8', font: { size: 12 } }
            },
            y: {
              grid: { color: 'rgba(226,232,240,0.6)', drawBorder: false },
              ticks: { color: '#94A3B8', font: { size: 12 } },
              beginAtZero: true
            }
          }
        }
      });
    }

    window.updateTxChartPeriod = function (period) {
      if (!txChart || !labelsMap[period] || !txMap[period]) return;

      txChart.data.labels = labelsMap[period];
      txChart.data.datasets[0].data = txMap[period];
      txChart.update();
    };

    document.querySelectorAll('.chart-period-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.chart-period-tab').forEach((tab) => tab.classList.remove('active'));
        btn.classList.add('active');
        const period = btn.dataset.period;
        if (period) window.updateTxChartPeriod(period);
      });
    });

    // Animate count numbers on dashboard
    const counters = document.querySelectorAll('.stat-value[data-count]');
    counters.forEach((el) => {
      const target = Number(el.dataset.count || '0');
      let current = 0;
      const duration = 1000;
      const start = performance.now();

      function animate(ts) {
        const progress = Math.min((ts - start) / duration, 1);
        current = Math.floor(target * progress);
        el.textContent = current.toLocaleString('en-IN');
        if (progress < 1) requestAnimationFrame(animate);
      }

      requestAnimationFrame(animate);
    });
  }

  if (typeof Chart !== 'undefined') {
    initCharts();
    return;
  }

  const chartScript = document.createElement('script');
  chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
  chartScript.async = true;
  chartScript.onload = initCharts;
  document.head.appendChild(chartScript);
})();
